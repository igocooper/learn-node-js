import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores){
  const html = stores && stores.map(store => {
    return `
      <a href="/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>
    `
  }).join('');

  return html;
};

function typeAhead(search) {
  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

  searchInput.on('input', function() {
    const value = this.value;

    if(!value) {
      searchResults.style.display = "none";
      return;
    }

    searchResults.style.display = "block";

    axios
      .get(`/api/search?q=${value}`)
      .then(res => {
        if (res.data.length) {
          const html = dompurify.sanitize(searchResultsHTML(res.data));
          searchResults.innerHTML = html;
          return;
        }
        // show that  no matches found 
        searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for ${value} found!</div> `);
      });

  });

  searchInput.on('keyup', function(e){
    if (![40, 38, 13].includes(e.keyCode)) {
      return; //skip
    }

    const activeClass = 'search__result--active';

    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result');
    let next;

    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length -1];
    } else if (e.keyCode === 38) {
      next = items[items.length -1];
    } else if (e.keyCode === 13 && current.href) {
      window.location = current.href;
      return;
    }

    if (current) {
      current.classList.remove(activeClass);
    }

    next.classList.add(activeClass);

  });

} 

module.exports = typeAhead;