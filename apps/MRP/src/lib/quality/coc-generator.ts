// lib/quality/coc-generator.ts
import { prisma } from "@/lib/prisma";

export async function generateCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.certificateOfConformance.count({
    where: {
      certificateNumber: {
        startsWith: `COC-${year}`,
      },
    },
  });
  return `COC-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function generateCoCPDF(cocId: string): Promise<Blob> {
  const coc = await prisma.certificateOfConformance.findUnique({
    where: { id: cocId },
    include: {
      salesOrder: {
        include: {
          customer: true,
        },
      },
      product: true,
      inspection: true,
    },
  });

  if (!coc) {
    throw new Error("Certificate not found");
  }

  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(10);
  doc.text("L-ERP, Inc.", 14, 15);
  doc.text("Certificate of Conformance", 14, 20);

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICATE OF CONFORMANCE", pageWidth / 2, 35, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Certificate #: ${coc.certificateNumber}`, pageWidth / 2, 45, {
    align: "center",
  });

  // Customer & Order Info
  let yPos = 60;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Information", 14, yPos);
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.text(`Customer: ${coc.salesOrder.customer.name}`, 14, yPos);
  yPos += 6;
  doc.text(`Sales Order: ${coc.salesOrder.orderNumber}`, 14, yPos);
  yPos += 6;
  doc.text(`Date: ${coc.preparedAt.toLocaleDateString()}`, 14, yPos);
  yPos += 15;

  // Product Info
  doc.setFont("helvetica", "bold");
  doc.text("Product Information", 14, yPos);
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.text(`Product: ${coc.product.name}`, 14, yPos);
  yPos += 6;
  doc.text(`SKU: ${coc.product.sku}`, 14, yPos);
  yPos += 6;
  doc.text(`Quantity: ${coc.quantity}`, 14, yPos);
  yPos += 6;

  const lotNumbers = coc.lotNumbers as string[];
  doc.text(`Lot Number(s): ${lotNumbers.join(", ")}`, 14, yPos);
  yPos += 6;

  if (coc.serialNumbers) {
    const serialNumbers = coc.serialNumbers as string[];
    doc.text(`Serial Number(s): ${serialNumbers.join(", ")}`, 14, yPos);
    yPos += 6;
  }
  yPos += 10;

  // Specifications Table
  if (coc.specifications) {
    const specs = coc.specifications as Array<{
      spec: string;
      requirement: string;
      result: string;
    }>;

    doc.setFont("helvetica", "bold");
    doc.text("Specifications", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Specification", "Requirement", "Result"]],
      body: specs.map((s) => [s.spec, s.requirement, s.result]),
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
      },
      styles: {
        fontSize: 9,
      },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Test Results Table
  if (coc.testResults) {
    const tests = coc.testResults as Array<{
      test: string;
      result: string;
      pass: boolean;
    }>;

    doc.setFont("helvetica", "bold");
    doc.text("Test Results", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [["Test", "Result", "Status"]],
      body: tests.map((t) => [t.test, t.result, t.pass ? "PASS" : "FAIL"]),
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
      },
      styles: {
        fontSize: 9,
      },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Certification Statement
  doc.setFont("helvetica", "bold");
  doc.text("Certification", 14, yPos);
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const certText = `We hereby certify that the above referenced product(s) have been manufactured and tested in accordance with applicable specifications and requirements, and conform to the purchase order requirements.`;
  const splitCert = doc.splitTextToSize(certText, pageWidth - 28);
  doc.text(splitCert, 14, yPos);
  yPos += splitCert.length * 5 + 15;

  // Signatures
  doc.setFontSize(10);
  doc.text("Prepared by:", 14, yPos);
  doc.text(`${coc.preparedBy}`, 14, yPos + 6);
  doc.text(`Date: ${coc.preparedAt.toLocaleDateString()}`, 14, yPos + 12);

  if (coc.approvedBy) {
    doc.text("Approved by:", pageWidth / 2, yPos);
    doc.text(`${coc.approvedBy}`, pageWidth / 2, yPos + 6);
    doc.text(
      `Date: ${coc.approvedAt?.toLocaleDateString() || ""}`,
      pageWidth / 2,
      yPos + 12
    );
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    "This certificate is electronically generated and valid without signature.",
    pageWidth / 2,
    pageHeight - 15,
    { align: "center" }
  );
  doc.text(
    `Generated: ${new Date().toISOString()}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  return doc.output("blob");
}
