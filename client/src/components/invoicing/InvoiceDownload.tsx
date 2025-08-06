import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { InvoiceWithItems } from '@shared/schema';

export const InvoiceDownload = ({
  invoice,
  clientName,
  projectTitle,
  companyName,
}: {
  invoice: InvoiceWithItems;
  clientName: string;
  projectTitle: string;
  companyName: string;
}) => (
  <PDFDownloadLink
    document={
      <InvoicePDF
        invoice={invoice}
        clientName={clientName}
        projectTitle={projectTitle}
        companyName={companyName}
      />
    }
    fileName={`IntDesPro-${invoice.invoiceNumber}.pdf`}
  >
    {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF')}
  </PDFDownloadLink>
);
