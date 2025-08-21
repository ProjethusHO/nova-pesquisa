document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const infoDiv = document.getElementById('info');
    const thetaInput = document.getElementById('theta');
    const muInput = document.getElementById('mu');
    const chartCanvas = document.getElementById('chart');

    // Constants
    const G = 9.81;
    const PLANE_LENGTH = 500;
    const BLOCK_SIZE = 30;
    const DT = 0.02; // Simulation time step in seconds
    const RENDER_SCALE = 20; // Pixels per meter
    const INITIAL_POS_X = 50;
    const UPDATE_INTERVAL_MS = 20; // Corresponds to 50 FPS

    const chart = new Chart(chartCanvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Velocidade (m/s)', borderColor: 'lime', backgroundColor: 'lime', data: [], fill: false },
                { label: 'Aceleração (m/s²)', borderColor: 'orange', backgroundColor: 'orange', data: [], fill: false }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Tempo (s)', color: 'white' }, ticks: { color: 'white' } },
                y: { title: { display: true, text: 'Valores', color: 'white' }, ticks: { color: 'white' } }
            },
            plugins: { legend: { labels: { color: 'white' } } }
        }
    });

    const simulation = {
        // State variables
        thetaDeg: 0,
        thetaRad: 0,
        mu: 0,
        a: 0,
        posX: 0,
        posY: 0,
        vel: 0,
        time: 0,
        paused: false,

        init() {
            this.reset();
            setInterval(() => this.update(), UPDATE_INTERVAL_MS);
            // Expose control functions to the global scope for HTML onclick attributes
            window.resetSimulation = () => this.reset();
            window.togglePause = () => this.togglePause();
        },

        calculateAcceleration() {
            const potentialA = G * Math.sin(this.thetaRad) - this.mu * G * Math.cos(this.thetaRad);
            // Static friction holds the block if the net force is not positive
            return (potentialA > 0) ? potentialA : 0;
        },

        // Store initial Y position, as it depends on canvas height
        initialY: 0,

        reset() {
            this.paused = true;
            this.thetaDeg = parseFloat(thetaInput.value);
            this.thetaRad = this.thetaDeg * Math.PI / 180;
            this.mu = parseFloat(muInput.value);
            this.a = this.calculateAcceleration();

            this.initialY = canvas.height - 50;
            this.posX = INITIAL_POS_X;
            this.posY = this.initialY;
            this.vel = 0;
            this.time = 0;

            chart.data.labels = [];
            chart.data.datasets.forEach(dataset => dataset.data = []);
            chart.update();
            this.draw();
            this.paused = false;
        },

        togglePause() {
            this.paused = !this.paused;
        },

        draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Define plane start and end points based on a fixed initial position
            const planeStartX = INITIAL_POS_X;
            const planeStartY = this.initialY;
            const planeEndX = planeStartX + PLANE_LENGTH * Math.cos(this.thetaRad);
            const planeEndY = planeStartY - PLANE_LENGTH * Math.sin(this.thetaRad);

            // Draw the inclined plane
            ctx.beginPath();
            ctx.moveTo(planeStartX, planeStartY);
            ctx.lineTo(planeEndX, planeEndY);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 5;
            ctx.stroke();

            // Save context, move to block's position, rotate, and draw the block
            ctx.save();
            ctx.translate(this.posX, this.posY);
            ctx.rotate(-this.thetaRad); // Rotate coordinate system to match the plane's angle
            ctx.fillStyle = 'red';
            ctx.fillRect(-BLOCK_SIZE / 2, -BLOCK_SIZE / 2, BLOCK_SIZE, BLOCK_SIZE);
            ctx.restore();

            // Update info text
            infoDiv.innerHTML = `Ângulo: ${this.thetaDeg}° | Aceleração: ${this.a.toFixed(2)} m/s² | Velocidade: ${this.vel.toFixed(2)} m/s`;
        },

        update() {
            if (this.paused) return;

            const endOfPlaneX = INITIAL_POS_X + PLANE_LENGTH * Math.cos(this.thetaRad);
            if (this.posX < endOfPlaneX) {
                this.vel += this.a * DT;
                const ds = this.vel * DT * RENDER_SCALE; // Displacement scaled for rendering

                this.posX += ds * Math.cos(this.thetaRad);
                this.posY -= ds * Math.sin(this.thetaRad);
                this.time += DT;

                // Update chart, but not on every single frame to avoid clutter
                if (Math.round(this.time * 100) % 10 === 0) { // Update chart every ~5 frames (0.1s)
                    chart.data.labels.push(this.time.toFixed(1));
                    chart.data.datasets[0].data.push(this.vel.toFixed(2));
                    chart.data.datasets[1].data.push(this.a.toFixed(2));
                    chart.update();
                }
            }
            this.draw();
        }
    };

    // Initialize the simulation
    simulation.init();

    // Standalone utility function for sharing
    window.compartilhar = function() {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: 'Experimento Plano Inclinado',
                text: 'Teste este simulador interativo de física!',
                url
            });
        } else {
            // A better fallback than alert
            navigator.clipboard.writeText(url).then(() => {
                alert("Link do experimento copiado para a área de transferência!");
            }, () => {
                alert("Copie e compartilhe este link: " + url);
            });
        }
    };
});
