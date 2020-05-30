const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
        .then(result => {
            //console.log(result);
            return result.json();
        })
        .then(data => {
            console.log(data);
            let element = btn.closest('article');
            element.parentNode.removeChild(element);
        })
        .catch(err => {
            console.log(err);
        });
};