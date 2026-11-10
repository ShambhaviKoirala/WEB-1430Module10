const API_KEY = 'b6c29d065888a5f1c39de556d5266225';
const API_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const NO_IMAGE = 'https://via.placeholder.com/500x750?text=No+Image';

const page = document.body.dataset.page;

function showSpinner() { document.getElementById('spinner').classList.add('show'); }
function hideSpinner() { document.getElementById('spinner').classList.remove('show'); }

async function fetchData(path, params = '') {
  showSpinner();
  try {
    const response = await fetch(`${API_URL}${path}?api_key=${API_KEY}&language=en-US${params}`);
    return await response.json();
  } catch (error) {
    alert('Could not load data. Please check your connection and API key.');
    return null;
  } finally {
    hideSpinner();
  }
}

function formatMoney(number) {
  return '$' + number.toLocaleString('en-US');
}

function createCard(item, type) {
  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date || 'No date';
  const image = item.poster_path ? IMG_URL + item.poster_path : NO_IMAGE;
  const detailsPage = type === 'movie' ? 'movie-details.html' : 'tv-details.html';

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <a href="${detailsPage}?id=${item.id}">
      <img src="${image}" alt="${title}" />
      <div class="card-info">
        <h3>${title}</h3>
        <p>${date}</p>
      </div>
    </a>`;
  return card;
}

function showCards(items, type) {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  items.forEach((item) => grid.appendChild(createCard(item, type)));
}

async function showSlider() {
  const data = await fetchData('/movie/now_playing');
  if (!data) return;

  const slider = document.getElementById('slider');
  data.results.forEach((movie) => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.innerHTML = `
      <a href="movie-details.html?id=${movie.id}">
        <img src="${movie.poster_path ? IMG_URL + movie.poster_path : NO_IMAGE}" alt="${movie.title}" />
      </a>
      <p>${movie.title} (${movie.vote_average.toFixed(1)} / 10)</p>`;
    slider.appendChild(slide);
  });

  new Swiper('.swiper', {
    slidesPerView: 2,
    spaceBetween: 16,
    loop: true,
    autoplay: { delay: 3000, disableOnInteraction: false },
    breakpoints: { 600: { slidesPerView: 3 }, 900: { slidesPerView: 5 } },
  });
}

async function showPopular(type) {
  const path = type === 'movie' ? '/movie/popular' : '/tv/popular';
  const data = await fetchData(path);
  if (data) showCards(data.results, type);
}
async function showDetails(type) {
  const id = new URLSearchParams(window.location.search).get('id');
  const item = await fetchData(`/${type}/${id}`);
  if (!item) return;

  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date || 'Unknown';
  const image = item.poster_path ? IMG_URL + item.poster_path : NO_IMAGE;
  const genres = item.genres.map((g) => `<li>${g.name}</li>`).join('');
  const companies = item.production_companies.map((c) => c.name).join(', ') || 'Unknown';

  let extraInfo;
  if (type === 'movie') {
    extraInfo = `
      <li><strong>Budget:</strong> ${item.budget ? formatMoney(item.budget) : 'Not available'}</li>
      <li><strong>Revenue:</strong> ${item.revenue ? formatMoney(item.revenue) : 'Not available'}</li>
      <li><strong>Runtime:</strong> ${item.runtime} minutes</li>`;
  } else {
    extraInfo = `
      <li><strong>Seasons:</strong> ${item.number_of_seasons}</li>
      <li><strong>Episodes:</strong> ${item.number_of_episodes}</li>
      <li><strong>Last episode aired:</strong> ${item.last_air_date || 'Unknown'}</li>`;
  }

  document.title = 'Flix | ' + title;
  document.getElementById('details').innerHTML = `
    <div class="details-top">                                                           
      <img src="${image}" alt="${title}" />                                                           
      <div class="details-text">                                                           
        <h1>${title}</h1>                                                           
        <p>Rating: ${item.vote_average.toFixed(1)} / 10</p>                                                           
        <p>Release date: ${date}</p>                                                           
        <p>${item.overview}</p>                                                           
        <ul class="genres">${genres}</ul>                                                           
        <br />                                                           
        <button class="btn" id="favorite-btn"></button>                                                           
        ${item.homepage ? `<a class="btn outline" href="${item.homepage}" target="_blank">Visit Website</a>` : ''}
      </div>                                                           
    </div>                                                           
    <div class="info-box">                                                           
      <h3>Details</h3>                                                           
      <ul>${extraInfo}<li><strong>Production companies:</strong> ${companies}</li></ul>
    </div>`;                                                           

  setupFavoriteButton({ id: item.id, type, title, date, poster_path: item.poster_path });                                                           
}
function setupSearchForm() {                                                           
  const form = document.getElementById('search-form');                                                           

  form.addEventListener('submit', (event) => {
    if (document.getElementById('term').value.trim() === '') {                                                           
      event.preventDefault();
      alert('Please enter a search term.');
    }                                                           
  });                                                           
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') || 'movie';
  const term = params.get('term') || '';                                                           
  const pageNumber = Number(params.get('page')) || 1;                                                           

  document.querySelector(`input[value="${type}"]`).checked = true;
  document.getElementById('term').value = term;
                                                           
  if (term) runSearch(type, term, pageNumber);
}                                                           

async function runSearch(type, term, pageNumber) {                                                           
  const data = await fetchData(`/search/${type}`, `&query=${encodeURIComponent(term)}&page=${pageNumber}`);
  if (!data) return;
                                                           
  if (data.results.length === 0) {
    alert('No results found.');                                                           
    return;
  }

  showCards(data.results, type);
  showPagination(type, term, pageNumber, data.total_pages);                                                           
}

function showPagination(type, term, pageNumber, totalPages) {
  const base = `search.html?type=${type}&term=${encodeURIComponent(term)}&page=`;
  const pagination = document.getElementById('pagination');                                                           

  pagination.innerHTML = `
    ${pageNumber > 1 ? `<a class="btn outline" href="${base}${pageNumber - 1}">Previous</a>` : ''}
    <span>Page ${pageNumber} of ${totalPages}</span>
    ${pageNumber < totalPages ? `<a class="btn outline" href="${base}${pageNumber + 1}">Next</a>` : ''}`;
}

function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites')) || [];                                                           
}

function isFavorite(id, type) {
  return getFavorites().some((fav) => fav.id === id && fav.type === type);
}

function setupFavoriteButton(item) {                                                           
  const button = document.getElementById('favorite-btn');

  function updateText() {
    button.textContent = isFavorite(item.id, item.type) ? 'Remove from Favorites' : 'Add to Favorites';
  }

  button.addEventListener('click', () => {                                                           
    let favorites = getFavorites();
    if (isFavorite(item.id, item.type)) {
      favorites = favorites.filter((fav) => !(fav.id === item.id && fav.type === item.type));
    } else {
      favorites.push(item);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));                                                           
    updateText();
  });

  updateText();
}                                                           

function showFavorites() {
  const favorites = getFavorites();
  if (favorites.length === 0) {                                                           
    document.getElementById('grid').innerHTML =
      '<p class="message">No favorites yet. Open a movie or show and click "Add to Favorites".</p>';
    return;
  }
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  favorites.forEach((fav) => grid.appendChild(createCard(fav, fav.type)));                                                           
}
function setActiveLink() {
  const links = { 'home': 'home', 'movie-details': 'home', 'shows': 'shows', 'tv-details': 'shows', 'search': 'search', 'favorites': 'favorites' };
  const active = document.querySelector(`[data-link="${links[page]}"]`);
  if (active) active.classList.add('active');
}
function init() {                                                           
  setActiveLink();

  if (page === 'home') { showSlider(); showPopular('movie'); }
  else if (page === 'shows') showPopular('tv');                                                           
  else if (page === 'movie-details') showDetails('movie');
  else if (page === 'tv-details') showDetails('tv');
  else if (page === 'search') setupSearchForm();                                                           
  else if (page === 'favorites') showFavorites();
}

init();