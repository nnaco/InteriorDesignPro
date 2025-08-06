import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { InvoiceWithItems } from '@shared/schema';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 10 },
  section: { marginBottom: 10 },
  tableHeader: {
    fontWeight: 700,
    flexDirection: 'row',
    borderBottom: '1 solid #ccc',
    paddingBottom: 4,
  },
  row: { flexDirection: 'row', marginBottom: 4 },
  col: { flex: 1 },
});

export const InvoicePDF = ({
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
  <Document>
    <Page style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{companyName}</Text>
        <Text>Invoice #: {invoice.invoiceNumber}</Text>
        <Text>
          Issued:{' '}
          {invoice.issueDate
            ? format(new Date(invoice.issueDate), 'MMM d, HH:mm')
            : 'N/A'}
        </Text>
        <Text>Due: {format(new Date(invoice.dueDate), 'MMM d, HH:mm')}</Text>
        {/* <Text>Status: {invoice.status}</Text> */}
      </View>

      <View style={styles.section}>
        <Text>Bill To: {clientName}</Text>
        <Text>Project: {projectTitle}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.tableHeader}>
          <Text style={styles.col}>Description</Text>
          <Text style={styles.col}>Qty</Text>
          <Text style={styles.col}>Rate(N)</Text>
          <Text style={styles.col}>Amount(N)</Text>
        </View>

        {invoice.items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.col}>{item.description}</Text>
            <Text style={styles.col}>{item.quantity}</Text>
            <Text style={styles.col}>{item.rate}</Text>
            <Text style={styles.col}>{item.amount}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text>Notes: N{invoice.notes || 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <Text>Subtotal: N{invoice.subtotal}</Text>
        <Text>
          Tax ({invoice.taxRate}%): N{invoice.taxAmount}
        </Text>
        <Text>Total: N{invoice.total}</Text>
      </View>
    </Page>
  </Document>
);
