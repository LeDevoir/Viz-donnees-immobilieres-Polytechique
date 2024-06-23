function loadVisualization(view) {
  const content = document.getElementById("content");
  content.innerHTML = "";

  const existingScripts = document.querySelectorAll("script.dynamic");
  existingScripts.forEach((script) => script.remove());

  let script = document.createElement("script");
  switch (view) {
    case "main":
      content.innerHTML = `
        <h1 class="text-lg font-bold">
          Bienvenue sur la page web de notre outil de visualisation de données
          immobilières!
        </h1>
        <p>
          En collaboration avec Samuel Ouvrard du journal Le Devoir, cet outil a
          été développé par George Salib, Zakaria Sbai-Chkirid, Khalil Beddouch,
          Nassim Boughedaoui, Abderahim Laribi et Artour Benevolenski dans le
          cadre du cours INF8808E à Polytechnique Montréal.
        </p>
        <p>
          Notre outil de visualisation de données immobilières offre une multitude
          d'informations clés pour aider le grand public ainsi que les
          journalistes chez Le Devoir à analyser le marché immobilier par région.
          Ces informations incluent la valeur d'achat, le nombre de ventes, les
          transferts de propriétés, le nombre d'hypothèques, le nombre de
          faillites et bien d'autres.
        </p>
      `;
      break;
    case "heatmap":
      content.innerHTML = '<div id="heatmap"></div>';
      loadScript("src/heatmap.js");
      break;
    case "sales":
      content.innerHTML = '<div id="sales"></div>';
      loadScript("src/sales.js");
      break;
    case "visualization2":
      content.innerHTML = '<div id="visualization2"></div>';
      loadScript("src/visualization2.js");
      break;
    case "visualization3":
      content.innerHTML = '<div id="visualization3"></div>';
      loadScript("src/visualization3.js");
      break;
  }
  content.appendChild(script);
}

function loadScript(src) {
  const script = document.createElement("script");
  script.src = src;
  script.className = "dynamic";
  document.body.appendChild(script);
}
