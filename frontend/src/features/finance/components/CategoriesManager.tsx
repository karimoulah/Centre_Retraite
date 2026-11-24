'use client';

import { useId, useState, useTransition } from 'react';
import { Controller } from 'react-hook-form';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/backoffice/ConfirmDialog';
import { StatusBadge } from '@/components/backoffice/StatusBadge';
import {
  CheckboxField,
  FormErrorAlert,
  FormField,
  SubmitButton,
  useActionForm,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ActionResult } from '@/lib/actions';
import type { Category, EntryDirection } from '@/lib/api/contracts';

import { createCategoryAction, updateCategoryAction } from '../actions';
import { categorySchema, type CategoryValues } from '../schemas';

const TAB_LABELS: Record<EntryDirection, string> = { INCOME: 'Recettes', EXPENSE: 'Dépenses' };

/** Income and expense categories in two tabs (F5-01). A category is deactivated, never deleted. */
export function CategoriesManager({
  income,
  expense,
}: {
  income: Category[];
  expense: Category[];
}) {
  return (
    <Tabs defaultValue="INCOME" className="flex flex-col gap-6">
      <TabsList aria-label="Sens des catégories" className="h-12 bg-surface-muted">
        {(['INCOME', 'EXPENSE'] as const).map((d) => (
          <TabsTrigger
            key={d}
            value={d}
            className="min-h-10 px-5 text-base text-text data-[state=active]:bg-brand-900 data-[state=active]:text-white"
          >
            {TAB_LABELS[d]} ({(d === 'INCOME' ? income : expense).filter((c) => c.active).length})
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="INCOME">
        <CategoryTable direction="INCOME" categories={income} />
      </TabsContent>
      <TabsContent value="EXPENSE">
        <CategoryTable direction="EXPENSE" categories={expense} />
      </TabsContent>
    </Tabs>
  );
}

function CategoryTable({
  direction,
  categories,
}: {
  direction: EntryDirection;
  categories: Category[];
}) {
  const income = direction === 'INCOME';
  return (
    <section
      className="flex flex-col gap-4"
      aria-label={`Catégories de ${TAB_LABELS[direction].toLowerCase()}`}
    >
      <div className="flex justify-end">
        <CategoryDialog direction={direction} />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Catégorie</TableHead>
              {income && <TableHead>Admissible au reçu fiscal</TableHead>}
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id} className={c.active ? undefined : 'text-text-muted'}>
                <TableCell className="font-medium">
                  {c.name}
                  {c.system && (
                    <span className="ml-2 text-sm font-normal text-text-muted">
                      (dons en ligne)
                    </span>
                  )}
                </TableCell>
                {income && (
                  <TableCell>
                    <ReceiptSwitch category={c} />
                  </TableCell>
                )}
                <TableCell>
                  <StatusBadge tone={c.active ? 'success' : 'neutral'}>
                    {c.active ? 'Active' : 'Désactivée'}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    <CategoryDialog direction={direction} category={c} />
                    {!c.system && <ActiveToggle category={c} />}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function ReceiptSwitch({ category }: { category: Category }) {
  const id = useId();
  const [checked, setChecked] = useState(category.receiptEligible);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <Switch
        id={id}
        checked={checked}
        disabled={pending || category.system || !category.active}
        aria-label={`Admissible au reçu fiscal : ${category.name}`}
        onCheckedChange={(value) => {
          setChecked(value);
          startTransition(async () => {
            const result = await updateCategoryAction(
              category.id,
              { receiptEligible: value },
              value ? 'Catégorie admissible au reçu.' : 'Catégorie non admissible au reçu.',
            );
            if (result.ok) toast.success(result.message);
            else {
              setChecked(!value);
              toast.error(result.message);
            }
          });
        }}
      />
      <span>{checked ? 'Oui' : 'Non'}</span>
    </div>
  );
}

function ActiveToggle({ category }: { category: Category }) {
  if (!category.active) {
    return (
      <ConfirmDialog
        trigger={<Button variant="outline">Réactiver</Button>}
        title={`Réactiver « ${category.name} » ?`}
        consequence="La catégorie sera de nouveau proposée lors de la saisie des écritures."
        confirmLabel="Réactiver"
        onConfirm={() =>
          updateCategoryAction(category.id, { active: true }, 'Catégorie réactivée.')
        }
      />
    );
  }
  return (
    <ConfirmDialog
      trigger={<Button variant="outline">Désactiver</Button>}
      title={`Désactiver « ${category.name} » ?`}
      consequence="Elle ne sera plus proposée pour les nouvelles écritures. Les écritures déjà classées dans cette catégorie la conservent : une catégorie n’est jamais supprimée."
      confirmLabel="Désactiver"
      tone="destructive"
      onConfirm={() =>
        updateCategoryAction(category.id, { active: false }, 'Catégorie désactivée.')
      }
    />
  );
}

/** Create (no category) or rename (with category). */
function CategoryDialog({
  direction,
  category,
}: {
  direction: EntryDirection;
  category?: Category;
}) {
  const [open, setOpen] = useState(false);
  const income = direction === 'INCOME';
  const { form, onSubmit, formError, setFormError } = useActionForm<CategoryValues, Category>({
    schema: categorySchema,
    defaultValues: {
      name: category?.name ?? '',
      receiptEligible: category?.receiptEligible ?? false,
    },
    action: (values): Promise<ActionResult<Category>> =>
      category
        ? updateCategoryAction(category.id, { name: values.name }, 'Catégorie renommée.')
        : createCategoryAction(direction, values),
    onSuccess: () => {
      setOpen(false);
      if (!category) form.reset({ name: '', receiptEligible: false });
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setFormError(null);
      }}
    >
      <DialogTrigger asChild>
        {category ? (
          <Button variant="ghost" aria-label={`Renommer ${category.name}`}>
            <Pencil aria-hidden />
            Renommer
          </Button>
        ) : (
          <Button variant="dark">
            <Plus aria-hidden />
            {income ? 'Nouvelle catégorie de recette' : 'Nouvelle catégorie de dépense'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {category
              ? 'Renommer la catégorie'
              : income
                ? 'Nouvelle catégorie de recette'
                : 'Nouvelle catégorie de dépense'}
          </DialogTitle>
          <DialogDescription>
            Le sens (recette ou dépense) ne peut plus changer une fois la catégorie créée.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <FormErrorAlert result={formError} />
          <FormField control={form.control} name="name" label="Nom" required>
            {(props) => <Input {...props} value={String(props.value)} autoComplete="off" />}
          </FormField>
          {income && !category && (
            <Controller
              control={form.control}
              name="receiptEligible"
              render={({ field }) => (
                <CheckboxField
                  checked={!!field.value}
                  onChange={field.onChange}
                  label="Admissible au reçu fiscal"
                  description="Cochez pour les dons : les montants pourront figurer sur un reçu officiel."
                />
              )}
            />
          )}
          <div>
            <SubmitButton pending={form.formState.isSubmitting}>
              {category ? 'Renommer' : 'Créer la catégorie'}
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
