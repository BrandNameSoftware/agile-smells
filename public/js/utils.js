function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  console.log('url - ' + url);
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function collapseDiv() {
  var readBlock = document.getElementById('collapse-content');
  if (readBlock.className == "collapse in") {
    readBlock.className = "collapse";
  } else {
    readBlock.className = "collapse in";
  }
}
