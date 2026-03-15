const $ = (arg: keyof HTMLElementTagNameMap) => document.querySelectorAll(arg);

class Scripting {
  private constructor() {}

  private static checkValidity() {
    const re = /^https:\/\/(www\.)?youtube\.com\/(watch\?v=[\w-]+|shorts\/[\w-]+)([?&].*)?$/;
    return re.test(document.URL);
  }

  static init() {
    if (this.checkValidity()) {
      // do stuff
    }
  }
  static addPageListener() {
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        this.init();
      }
    });
    observer.observe(document, { subtree: true, childList: true });
  }
}

Scripting.addPageListener();
