/** Files "uploaded" in mock mode (see src/app/mock-upload): only their size and type are kept. */
export const mockUploads = () => {
  const store = globalThis as unknown as {
    __lesaines_mock_uploads?: Map<string, { size: number; type: string }>;
  };
  store.__lesaines_mock_uploads ??= new Map();
  return store.__lesaines_mock_uploads;
};
