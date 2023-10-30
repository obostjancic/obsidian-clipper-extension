javascript: Promise.all([
  import("https://unpkg.com/turndown@6.0.0?module"),
  import("https://unpkg.com/@tehshrike/readability@0.2.0"),
]).then(async ([{ default: Turndown }, { default: Readability }]) => {
  /* Optional vault name */
  const vault = "";

  /* Optional folder name such as "Clippings/" */
  const folder = "Clippings/";

  /* Optional tags  */
  let tags = "clippings";

  /* Parse the site's meta keywords content into tags, if present */
  if (document.querySelector('meta[name="keywords" i]')) {
    let keywords = document
      .querySelector('meta[name="keywords" i]')
      .getAttribute("content")
      .split(",");

    keywords.forEach(function (keyword) {
      let tag = " " + keyword.split(" ").join("");
      tags += tag;
    });
  }

  function getSelectionHtml() {
    let html = "";
    if (typeof window.getSelection != "undefined") {
      let sel = window.getSelection();
      if (sel.rangeCount) {
        let container = document.createElement("div");
        for (let i = 0, len = sel.rangeCount; i < len; ++i) {
          container.appendChild(sel.getRangeAt(i).cloneContents());
        }
        html = container.innerHTML;
      }
    } else if (typeof document.selection != "undefined") {
      if (document.selection.type == "Text") {
        html = document.selection.createRange().htmlText;
      }
    }
    return html;
  }

  const selection = getSelectionHtml();

  const { title, byline, content } = new Readability(
    document.cloneNode(true)
  )?.parse() || { title: "", byline: "", content: "" };

  function getFileName(fileName) {
    const platform = window.navigator.platform;
    const windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"];

    if (windowsPlatforms.indexOf(platform) !== -1) {
      fileName = fileName.replace(":", "").replace(/[/\\?%*|"<>]/g, "-");
    } else {
      fileName = fileName
        .replaceAll(":", "")
        .replaceAll(/\//g, "-")
        .replaceAll(/\\/g, "-");
    }
    return fileName;
  }
  const fileName = getFileName(title);

  const markdownify = selection || content;

  const vaultName = vault ? "&vault=" + encodeURIComponent(`${vault}`) : "";

  const markdownBody = new Turndown({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  }).turndown(markdownify);

  const today = new Date().toISOString().slice(0, 10);

  // Utility function to get meta content by name or property
  function getMetaContent(attr, value) {
    var element = document.querySelector(`meta[${attr}='${value}']`);
    return element ? element.getAttribute("content").trim() : "";
  }

  // Fetch byline, meta author, property author, or site name
  const author =
    byline ||
    getMetaContent("name", "author") ||
    getMetaContent("property", "author") ||
    getMetaContent("property", "og:site_name");

  // Check if there's an author and add brackets
  const authorBrackets = author ? `"[[${author}]]"` : "";

  /* YAML front matter as tags render cleaner with special chars  */
  const fileContent =
    "---\n" +
    'category: "[[Clippings]]"\n' +
    "author: " +
    authorBrackets +
    "\n" +
    'title: "' +
    title +
    '"\n' +
    "source: " +
    document.URL +
    "\n" +
    "clipped: " +
    today +
    "\n" +
    "topics: \n" +
    "tags: [" +
    tags +
    "]\n" +
    "---\n\n" +
    markdownBody;

  document.location.href =
    "obsidian://new?" +
    "file=" +
    encodeURIComponent(folder + fileName) +
    "&content=" +
    encodeURIComponent(fileContent) +
    vaultName;
});
