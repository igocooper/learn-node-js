function autocomplete(input, latInput, lngInput) {
    if (!input) return
    const dropdown = new google.maps.places.Autocomplete(input);

    dropdown.addListener('place_changed', function(){
      const place = dropdown.getPlace();
      latInput.value = place.geometry.location.lat();
      lngInput.value = place.geometry.location.lng();
    });

    // prevent form submit if someone hits enter in the locations dropdown
    input.on('keydown', function(e){
      if (e.keyCode === 13) e.preventDefault();
    });
}

export default autocomplete;