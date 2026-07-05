export {};

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  data?: DataView;
}

interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFReadingEvent extends Event {
  message: NDEFMessage;
  serialNumber: string;
}

declare class NDEFReader extends EventTarget {
  scan(): Promise<void>;
  onreading: ((this: NDEFReader, ev: NDEFReadingEvent) => void) | null;
  onreadingerror: ((this: NDEFReader, ev: Event) => void) | null;
}

declare global {
  interface Window {
    NDEFReader?: typeof NDEFReader;
  }
}
