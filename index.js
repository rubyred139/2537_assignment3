const PAGE_SIZE = 10;
const numPageBtn = 5;
let currentPage = 1;
let pokemons = []
let selectedTypes = [];
let filtered_pokemon = [];

// update pagination div 
const updatePaginationDiv = (currentPage, numPages) => {
  $('#pagination').empty()

  var startI = Math.max(1, currentPage - Math.floor(numPageBtn/2));
  var endI = Math.min(numPages, currentPage + Math.floor(numPageBtn/2))
  if (currentPage > 1)  {
    $('#pagination').append(`
    <button class="btn btn-primary page ml-1 numberedButtons" id="pageFirst" value ="1">First</button>
    `)

    $('#pagination').append(`
      <button class="btn btn-primary ml-1 numberedButtons page" id="pagePrev" value="${currentPage-1}">Prev</button>
    `)
  }
  
  for (let i = startI; i <= endI; i++) {
    $('#pagination').append(`
    <button class="btn btn-primary page ml-1 numberedButtons ${i === currentPage ? 'active': ''}" value="${i}">${i}</button>
    `)
  }

  if (currentPage < numPages)  {
    $('#pagination').append(`
      <button class="btn btn-primary page ml-1 numberedButtons" id="pageNext" value="${currentPage+1}">Next</button>
    `)
    $('#pagination').append(`
    <button class="btn btn-primary page ml-1 numberedButtons" id="pageLast" value="${numPages}">Last</button>
  `)
  }
} 

// display pokemon cards for current page
const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
  selected_pokemons = pokemons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  $('#pokeCards').empty()
  selected_pokemons.forEach(async (pokemon) => {
    const res = await axios.get(pokemon.url)
    $('#pokeCards').append(`
      <div class="pokeCard card" pokeName=${res.data.name}   >
        <h3>${res.data.name.toUpperCase()}</h3> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal" active="true">
          More
        </button>
        </div>  
        `)
  })

    // Display the total number of pokemon and the number of pokemon displayed
    $('#total-pokemons').text(pokemons.length)
    $('#displayed-pokemons').text(selected_pokemons.length)
}

const applyfilter = async(selectedTypes) => {

  // Delete all elements inside of the array everytime it is called
  filtered_pokemon = []
  for (let i=0; i < selectedTypes.length; i++) {
    console.log(i)
    filtered_pokemon.push((await axios.get(`https://pokeapi.co/api/v2/type/${selectedTypes[i]}`)).data.pokemon.map((pokemon) => pokemon.pokemon));

  }

  if (selectedTypes.length == 0) {
    let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810')
    pokemons = response.data.results;

  } else {
    // Nested loop to find the common pokemon that belongs to two selected types
      pokemons = filtered_pokemon[0];

    for (let i = 1; i < filtered_pokemon.length; i++) {
      const innerArray = filtered_pokemon[i];
      const filtered = [];

    for (let j = 0; j < pokemons.length; j++) {
      const pokemon = pokemons[j];

      if (innerArray.some((p) => p.name === pokemon.name)) {
        filtered.push(pokemon);
      }
    }
      pokemons = filtered;
    }
  }

  paginate(currentPage, PAGE_SIZE, pokemons);

}


const setup = async () => {
  // Display filter 
  $('#pokeFilter').empty()
  let res = await axios.get('https://pokeapi.co/api/v2/type');

  $("#pokeFilter").append(
    res.data.results.map((type) => `
      <div class="form-check form-check-inline">
        <input class="filterbox form-check-input" type="checkbox" value="${type.name}" id="flexCheckDefault">
        <label class="form-check-label" for="flexCheckDefault">
          ${type.name}
        </label>
      </div>
    `).join("")
  )


  $('body').on('change', ".filterbox", async function (e) {
    typeName = e.target.value
    if($(this).is(':checked')) {
      selectedTypes.push(typeName)

    } else {
      const index = selectedTypes.indexOf(typeName);      

      if (index !== -1) {
        selectedTypes.splice(index, 1);
      }
    }
    console.log("Selected: " + selectedTypes)
    applyfilter(selectedTypes)

  });


  // Display pokecards according to pagination
  $('#pokeCards').empty()

  let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810')

  pokemons = response.data.results;

  paginate(currentPage, PAGE_SIZE, pokemons)
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE)
  updatePaginationDiv(currentPage, numPages)

  // pop up modal when clicking on a pokemon card
  // add event listener to each pokemon card
  $('body').on('click', '.pokeCard', async function (e) {
    const pokemonName = $(this).attr('pokeName')
    // console.log("pokemonName: ", pokemonName);
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
    // console.log("res.data: ", res.data);
    const types = res.data.types.map((type) => type.type.name)
    // console.log("types: ", types);
    $('.modal-body').html(`
        <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
        <h3>Abilities</h3>
        <ul>
        ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
        </ul>
        </div>

        <div>
        <h3>Stats</h3>
        <ul>
        ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
        </ul>

        </div>

        </div>
          <h3>Types</h3>
          <ul>
          ${types.map((type) => `<li>${type}</li>`).join('')}
          </ul>
      
        `)
    $('.modal-title').html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
        `)
  })

  // add event listener to pagination buttons
  $('body').on('click', ".numberedButtons", async function (e) {
    currentPage = Number(e.target.value)
    paginate(currentPage, PAGE_SIZE, pokemons)

    //update pagination buttons
    updatePaginationDiv(currentPage, numPages)
  })

}


$(document).ready(setup)