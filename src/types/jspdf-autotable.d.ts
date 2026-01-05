// This is a basic type definition file to satisfy TypeScript for jspdf-autotable.
// For a more comprehensive one, you might need to install @types/jspdf-autotable if it exists
// or create a more detailed definition.

declare module 'jspdf-autotable' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export default function autoTable(doc: any, options: any): void;
}
