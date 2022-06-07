if (import.meta.hot) {
    import.meta.hot.accept(m => m);
}
const sleep = ms => new Promise(res => setTimeout(res, ms));
const droparea = document.querySelector('.droparea');
const move = async ({ key, fromIndex, toIndex }) => {
    const fromEl = droparea.querySelector(`[data-index="${fromIndex}"]`);
    const toEl = droparea.querySelector(`[data-index="${toIndex}"]`);
    if (fromIndex > toIndex) {
        toEl.insertAdjacentElement('beforebegin', fromEl);
    } else {
        toEl.insertAdjacentElement('afterend', fromEl);
    }
    const keys = [];
    const children = droparea.querySelectorAll('[data-index]');
    for (let i = 0; i < children.length; i++) {
        const child = children.item(i);
        child.dataset.index = i;
        keys.push(child.dataset.key);
    }
    await fetch('/api/admin/order', {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(keys)
    })
}
const cancel = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
}
droparea.addEventListener('dragover', cancel);
droparea.addEventListener('dragenter', cancel);
droparea.addEventListener('drop', (event: DragEvent) => {
    const { index: fromIndex, key } = JSON.parse(event.dataTransfer.getData('application/json'));
    const toIndex = Number.parseInt(event.target.closest('[data-index]').dataset.index);
    move({ key, fromIndex, toIndex });
});
droparea.addEventListener('dragstart', (event: DragEvent) => {  
    const detail = { index: Number.parseInt(event.target.dataset?.index ?? '0'), key: event.target.dataset?.key };
    event.dataTransfer.setData('application/json', JSON.stringify(detail))
})
