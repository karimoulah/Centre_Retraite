import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 0001 — initial schema of the API (schema "app"; Payload keeps its own "payload" schema).
 * Written in SQL so constraints, triggers and the append-only audit log live in the database itself.
 */
export class InitialSchema1764000000000 implements MigrationInterface {
  name = 'InitialSchema1764000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE SCHEMA IF NOT EXISTS app;
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TYPE app.role AS ENUM ('ADMIN', 'FINANCE', 'TESTIMONIALS', 'MEMBER');
      CREATE TYPE app.age_category AS ENUM ('50_64', '65_74', '75_84', '85_PLUS');
      CREATE TYPE app.membership_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
      CREATE TYPE app.consent_type AS ENUM ('BIRTHDAY_WISHES', 'NEWSLETTER', 'TESTIMONIAL_PUBLICATION');
      CREATE TYPE app.consent_channel AS ENUM ('EMAIL', 'SMS', 'ANY');
      CREATE TYPE app.token_purpose AS ENUM ('RESET', 'INVITATION');
      CREATE TYPE app.notification_status AS ENUM ('QUEUED', 'SENT', 'FAILED');

      -- Keeps updated_at current on every UPDATE.
      CREATE FUNCTION app.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

      -- Author of the current transaction, set by the API with SET LOCAL app.actor_id.
      CREATE FUNCTION app.current_actor() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT NULLIF(current_setting('app.actor_id', true), '')::uuid
      $$;

      CREATE SEQUENCE app.member_number_seq;

      CREATE TABLE app.members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        member_number text NOT NULL UNIQUE DEFAULT 'M-' || lpad(nextval('app.member_number_seq')::text, 4, '0'),
        first_name text NOT NULL CHECK (length(trim(first_name)) > 0),
        last_name text NOT NULL CHECK (length(trim(last_name)) > 0),
        email text NOT NULL,
        phone text,
        address text,
        age_category app.age_category NOT NULL,
        birth_date date CHECK (birth_date IS NULL OR birth_date < current_date),
        active boolean NOT NULL DEFAULT true,
        joined_at timestamptz NOT NULL DEFAULT now(),
        anonymized_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX members_email_key ON app.members (lower(email)) WHERE anonymized_at IS NULL;
      CREATE TRIGGER members_touch BEFORE UPDATE ON app.members FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

      CREATE TABLE app.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL,
        password_hash text,
        first_name text NOT NULL CHECK (length(trim(first_name)) > 0),
        last_name text NOT NULL CHECK (length(trim(last_name)) > 0),
        active boolean NOT NULL DEFAULT true,
        failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
        locked_until timestamptz,
        last_login_at timestamptz,
        member_id uuid UNIQUE REFERENCES app.members (id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX users_email_key ON app.users (lower(email));
      CREATE TRIGGER users_touch BEFORE UPDATE ON app.users FOR EACH ROW EXECUTE FUNCTION app.touch_updated_at();

      CREATE TABLE app.user_roles (
        user_id uuid NOT NULL REFERENCES app.users (id) ON DELETE CASCADE,
        role app.role NOT NULL,
        PRIMARY KEY (user_id, role)
      );

      -- Refresh sessions: one row per issued refresh token, revoked on logout or rotation.
      CREATE TABLE app.sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES app.users (id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX sessions_user_idx ON app.sessions (user_id);

      -- Single-use tokens for password reset and invitations; only their SHA-256 hash is stored.
      CREATE TABLE app.password_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES app.users (id) ON DELETE CASCADE,
        token_hash text NOT NULL UNIQUE,
        purpose app.token_purpose NOT NULL,
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE app.membership_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name text NOT NULL,
        last_name text NOT NULL,
        email text NOT NULL,
        phone text,
        address text,
        age_category app.age_category NOT NULL,
        birth_date date,
        birthday_wishes_consent boolean NOT NULL DEFAULT false,
        newsletter_consent boolean NOT NULL DEFAULT false,
        status app.membership_status NOT NULL DEFAULT 'PENDING',
        submitted_at timestamptz NOT NULL DEFAULT now(),
        decided_at timestamptz,
        decided_by uuid REFERENCES app.users (id),
        decided_automatically boolean NOT NULL DEFAULT false,
        rejection_reason text,
        member_id uuid REFERENCES app.members (id),
        CONSTRAINT membership_decision_consistent CHECK (
          (status = 'PENDING' AND decided_at IS NULL)
          OR (status = 'APPROVED' AND decided_at IS NOT NULL AND member_id IS NOT NULL)
          OR (status = 'REJECTED' AND decided_at IS NOT NULL AND length(trim(coalesce(rejection_reason, ''))) >= 5)
        )
      );
      CREATE INDEX membership_requests_status_idx ON app.membership_requests (status, submitted_at DESC);

      -- A decided request can never change again (409 for the API, error for anyone else).
      CREATE FUNCTION app.membership_requests_freeze() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF OLD.status <> 'PENDING' THEN
          RAISE EXCEPTION 'membership request % already decided', OLD.id USING ERRCODE = 'P0409';
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER membership_requests_freeze BEFORE UPDATE ON app.membership_requests
        FOR EACH ROW EXECUTE FUNCTION app.membership_requests_freeze();

      -- Consents: dated agreement and withdrawal, at most one active row per member, type and channel.
      CREATE TABLE app.consents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id uuid NOT NULL REFERENCES app.members (id) ON DELETE CASCADE,
        type app.consent_type NOT NULL,
        channel app.consent_channel NOT NULL DEFAULT 'ANY',
        granted_at timestamptz NOT NULL DEFAULT now(),
        withdrawn_at timestamptz,
        CHECK (withdrawn_at IS NULL OR withdrawn_at >= granted_at)
      );
      CREATE UNIQUE INDEX consents_one_active ON app.consents (member_id, type, channel) WHERE withdrawn_at IS NULL;

      CREATE TABLE app.settings (
        key text PRIMARY KEY,
        value jsonb NOT NULL,
        updated_at timestamptz,
        updated_by uuid REFERENCES app.users (id)
      );

      -- Outgoing messages; unique_key makes scheduling idempotent.
      CREATE TABLE app.notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type text NOT NULL,
        recipient text NOT NULL,
        data jsonb NOT NULL DEFAULT '{}',
        unique_key text NOT NULL UNIQUE,
        status app.notification_status NOT NULL DEFAULT 'QUEUED',
        attempts integer NOT NULL DEFAULT 0,
        last_error text,
        created_at timestamptz NOT NULL DEFAULT now(),
        sent_at timestamptz
      );

      -- Append-only audit log: the author defaults to the transaction's app.actor_id.
      CREATE TABLE app.audit_logs (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        at timestamptz NOT NULL DEFAULT now(),
        actor_id uuid DEFAULT app.current_actor() REFERENCES app.users (id),
        action text NOT NULL,
        entity_type text NOT NULL,
        entity_id text NOT NULL,
        entity_label text NOT NULL DEFAULT '',
        before jsonb,
        after jsonb
      );
      CREATE INDEX audit_logs_at_idx ON app.audit_logs (at DESC);
      CREATE INDEX audit_logs_entity_idx ON app.audit_logs (entity_type, entity_id);
      CREATE FUNCTION app.audit_logs_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'audit_logs is append-only' USING ERRCODE = 'insufficient_privilege';
      END $$;
      CREATE TRIGGER audit_logs_no_update BEFORE UPDATE OR DELETE ON app.audit_logs
        FOR EACH STATEMENT EXECUTE FUNCTION app.audit_logs_append_only();
      CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON app.audit_logs
        FOR EACH STATEMENT EXECUTE FUNCTION app.audit_logs_append_only();

      -- Reference data.
      INSERT INTO app.settings (key, value) VALUES ('membership', '{"autoApprove": false}');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS app CASCADE;`);
  }
}
