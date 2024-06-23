function loadVisualization(view) {
    const content = document.getElementById('content');
    content.innerHTML = '';

    switch(view) {
        case 'main':
            content.innerHTML = `
                <h1>Welcome to the Visualization Project</h1>
                <p>Select a visualization from the sidebar.</p>
            `;
            break;
        case 'heatmap':
            content.innerHTML = '<div id="heatmap"></div>';
            loadHeatmap();
            break;
        case 'visualization1':
            content.innerHTML = '<div id="visualization1"></div>';
            loadVisualization1();
            break;
        case 'visualization2':
            content.innerHTML = '<div id="visualization2"></div>';
            loadVisualization2();
            break;
        case 'visualization3':
            content.innerHTML = '<div id="visualization3"></div>';
            loadVisualization3();
            break;
    }
}

function loadHeatmap() {
    // Load heatmap script
    const script = document.createElement('script');
    script.src = 'heatmap.js';
    document.body.appendChild(script);
}

function loadVisualization1() {
    // Load visualization1 script
    const script = document.createElement('script');
    script.src = 'script/visualization1.js';
    document.body.appendChild(script);
}

function loadVisualization2() {
    // Load visualization2 script
    const script = document.createElement('script');
    script.src = 'script/visualization2.js';
    document.body.appendChild(script);
}

function loadVisualization3() {
    // Load visualization3 script
    const script = document.createElement('script');
    script.src = 'script/visualization3.js';
    document.body.appendChild(script);
}
