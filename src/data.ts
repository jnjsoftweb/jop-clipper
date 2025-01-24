export class ClipperData {
  private data: any = {};

  constructor() {
    // Initialize data structure
  }

  public setData(key: string, value: any): void {
    this.data[key] = value;
  }

  public getData(key: string): any {
    return this.data[key];
  }

  public clearData(): void {
    this.data = {};
  }
}
