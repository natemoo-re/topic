for (const element of document.querySelectorAll('[data-page-transition]')) {
    element.style.contain = 'paint';
    element.style.pageTransitionTag = element.dataset.pageTransition;
}
