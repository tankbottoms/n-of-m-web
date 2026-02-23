declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
    };
    jsPDF?: {
      orientation?: 'portrait' | 'landscape';
      unit?: 'mm' | 'cm' | 'in' | 'px' | 'pt' | 'pc';
      format?: string;
    };
    pagebreak?: {
      mode?: string[];
    };
  }

  interface Html2PdfWorker {
    set(options: Html2PdfOptions): Html2PdfWorker;
    from(element: HTMLElement | HTMLElement[] | string): Html2PdfWorker;
    save(): Promise<void>;
  }

  function html2pdf(): Html2PdfWorker;
  const _default: typeof html2pdf;
  export default _default;
}
