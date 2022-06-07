import morph from 'micromorph';

const p = new DOMParser();
const CLICK_PARAM = 'c';
const CLICK_ATTRIBUTE = `data-click`
const DIRS = {
  UP: 2,
  RIGHT: 1,
  DOWN: -2,
  LEFT: -1,
}

function click(doc: Document, target: number) {
  const elements = doc.querySelectorAll(`[${CLICK_ATTRIBUTE}]`);
  elements.forEach((element, key) => {
    if (key < target) {
      if (element.getAttribute(CLICK_ATTRIBUTE) === '1') return;
      element.setAttribute(CLICK_ATTRIBUTE, '1');
    } else {
      element.setAttribute(CLICK_ATTRIBUTE, '0');
    }
  })
}

window.addEventListener('DOMContentLoaded', () => {
  const { searchParams } = new URL(location.toString());
  tag(document);
  if (searchParams.get('preview') != null) return;
  const i = Number.parseInt(searchParams.get(CLICK_PARAM) ?? '');
  click(document, i);
})

let maxURL: URL;
async function nav(url: URL, dir: number) {
  if (dir < 0) {
    if (window.navigation.canGoBack) {
      const prevEntry = window.navigation.entries()[window.navigation.currentEntry.index - 1];
      if (prevEntry.url.toString() === url.toString()) {
        if (dir !== DIRS.LEFT || url.searchParams.get(CLICK_PARAM) === undefined) {
          return window.navigation.back();
        }
      }
    }
  } else if (dir > 0) {
    if (window.navigation.canGoForward) {
      const nextEntry = window.navigation.entries()[window.navigation.currentEntry.index + 1];
      if (nextEntry.url.toString() === url.toString()) {
        return window.navigation.forward();
      }
    }
  }
  if (!url.searchParams.get(CLICK_PARAM)) {
    const { status } = await fetch(url.toString(), { method: 'HEAD', redirect: 'manual' });
    if (status === 0) {
      maxURL = url;
      return;
    }
  }
  window.navigation.navigate(url, { info: { direction: dir }});
}

async function next(clicks: boolean, dir: number) {
    const url = new URL(location.toString());
    const parts = url.pathname.split('/');
    const n = Number.parseInt(parts.at(-1)) + 1;
    if (!clicks || (clicks && !document.querySelector(`[${CLICK_ATTRIBUTE}="0"]`))) {
        const prefix = parts.slice(0, -1);
        url.pathname = [...prefix, n].join('/')
        url.searchParams.delete(CLICK_PARAM);
        // if (!maxURL || (maxURL && url.pathname !== maxURL.pathname)) return nav(url, dir);
        return nav(url, dir);
    } else {
      const url = new URL(location.toString());
      const click = Number.parseInt(url.searchParams.get(CLICK_PARAM) ?? '0');
      url.searchParams.set(CLICK_PARAM, `${click + 1}`);
      return nav(url, dir);
    }
}

async function prev(clicks: boolean, dir: number) {
  const url = new URL(location.toString());
  const i = Number.parseInt(url.searchParams.get(CLICK_PARAM) ?? '0');
  const parts = url.pathname.split('/');
  const n = Number.parseInt(parts.at(-1)) - 1;
  if (!clicks || (clicks && i === 0)) {
    if (n <= 0) {
      return;
    }
    const prefix = parts.slice(0, -1);
    url.pathname = [...prefix, n].join('/');
    url.searchParams.delete(CLICK_PARAM);
    return nav(url, dir);
  } else {
    if (dir === DIRS.DOWN || url.searchParams.get(CLICK_PARAM) === "1") {
      url.searchParams.delete(CLICK_PARAM);
    } else {
      url.searchParams.set(CLICK_PARAM, `${i - 1}`);
    }
    return nav(url, dir);
  }
}

window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp': return next(false, DIRS.UP);
        case 'ArrowRight': return next(true, DIRS.RIGHT);
        case 'ArrowDown': return prev(false, DIRS.DOWN);
        case 'ArrowLeft': return prev(true, DIRS.LEFT);
    }
})

function getDir(src: URL, dest: URL): string | undefined {
  if (src.pathname === dest.pathname) return;
  const from = Number.parseInt(src.pathname.slice(1).split('/').at(-1));
  const to = Number.parseInt(dest.pathname.slice(1).split('/').at(-1));
  if (from > to) return 'back';
}

function tag(doc: Document) {
  let title = doc.querySelector('title');
  if (!title) {
    title = doc.createElement('title');
    const h1 = doc.querySelector('h1') ?? doc.querySelector('h2');
    title.text = h1.textContent;
    doc.head.appendChild(title);
  }
  for (const element of doc.querySelectorAll('[data-transition]')) {
    element.style.setProperty('contain', 'paint');
    element.style.setProperty('page-transition-tag', element.dataset.transition);
    delete element.dataset.transition;
  }
}

window.navigation.addEventListener("navigate", e => {
  if (!e.canTransition || e.hashChange || e.downloadRequest !== null) {
    return;
  }
  const src = new URL(location.toString());
  const dest = new URL(e.destination.url);
  const dir = getDir(src, dest);
  tag(document);

  async function navigate() {
    if (dir) document.documentElement.classList.add(dir);
    let i = Number.parseInt(dest.searchParams.get(CLICK_PARAM) ?? '0');
    if (src.pathname === dest.pathname) {
      click(document, i);
      return;
    }

    const res = await fetch(dest.toString(), { method: 'GET', signal: e.signal }).then(res => res.text());
    const doc = p.parseFromString(res, 'text/html');
    tag(doc);
    if (dir) doc.documentElement.classList.add(dir);

    click(doc, i);
    await morph(document, doc);
    if (e.info?.direction === DIRS.LEFT) {
      i = document.querySelectorAll('[data-click]').length;
      dest.searchParams.set(CLICK_PARAM, `${i}`);
      location.replace(dest);
    }
  }

  async function animatedNavigate() {
    const transition = document.createDocumentTransition();
    await transition.start(navigate);
    document.documentElement.classList.remove(dir);
  }

  let fn = navigate;
  if (document.createDocumentTransition && dest.pathname !== src.pathname) {
    fn = animatedNavigate
  }

  e.transitionWhile(fn())
});
