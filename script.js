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
    const PLANE_LENGTH_RATIO = 0.8; // Plane length as a ratio of canvas width
    const BLOCK_SIZE_RATIO = 0.05; // Block size as a ratio of canvas height
    const DT = 0.02; // Simulation time step in seconds
    const RENDER_SCALE = 20; // This might need to be dynamic now
    const INITIAL_POS_X_RATIO = 0.1; // Initial X position as a ratio of canvas width
    const UPDATE_INTERVAL_MS = 20;

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
            maintainAspectRatio: true,
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
        initialY: 0,
        initialX: 0,
        planeLength: 0,
        blockSize: 0,

        init() {
            // Expose control functions to the global scope
            window.resetSimulation = () => this.reset();
            window.togglePause = () => this.togglePause();
            // The main loop starts after the first resize/reset
            setInterval(() => this.update(), UPDATE_INTERVAL_MS);
        },

        calculateAcceleration() {
            const potentialA = G * Math.sin(this.thetaRad) - this.mu * G * Math.cos(this.thetaRad);
            return (potentialA > 0) ? potentialA : 0;
        },

        reset() {
            this.paused = true;
            this.thetaDeg = parseFloat(thetaInput.value);
            this.thetaRad = this.thetaDeg * Math.PI / 180;
            this.mu = parseFloat(muInput.value);

            // Update simulation constants based on new canvas size
            this.planeLength = canvas.width * PLANE_LENGTH_RATIO;
            this.blockSize = canvas.height * BLOCK_SIZE_RATIO;
            this.initialX = canvas.width * INITIAL_POS_X_RATIO;
            this.initialY = canvas.height - (canvas.height * 0.1); // Start 10% from bottom

            this.a = this.calculateAcceleration();

            this.posX = this.initialX;
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

            const planeEndX = this.initialX + this.planeLength * Math.cos(this.thetaRad);
            const planeEndY = this.initialY - this.planeLength * Math.sin(this.thetaRad);

            ctx.beginPath();
            ctx.moveTo(this.initialX, this.initialY);
            ctx.lineTo(planeEndX, planeEndY);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 5;
            ctx.stroke();

            ctx.save();
            ctx.translate(this.posX, this.posY);
            ctx.rotate(-this.thetaRad);
            ctx.fillStyle = 'red';
            ctx.fillRect(-this.blockSize / 2, -this.blockSize / 2, this.blockSize, this.blockSize);
            ctx.restore();

            infoDiv.innerHTML = `Ângulo: ${this.thetaDeg}° | Aceleração: ${this.a.toFixed(2)} m/s² | Velocidade: ${this.vel.toFixed(2)} m/s`;
        },

        update() {
            if (this.paused) return;

            const endOfPlaneX = this.initialX + this.planeLength * Math.cos(this.thetaRad);
            if (this.posX < endOfPlaneX) {
                this.vel += this.a * DT;
                // The visual displacement should be proportional to the canvas size
                const ds = this.vel * DT * (canvas.width / 800); // Scale velocity based on original canvas width

                this.posX += ds * Math.cos(this.thetaRad);
                this.posY -= ds * Math.sin(this.thetaRad);
                this.time += DT;

                if (Math.round(this.time * 100) % 10 === 0) {
                    chart.data.labels.push(this.time.toFixed(1));
                    chart.data.datasets[0].data.push(this.vel.toFixed(2));
                    chart.data.datasets[1].data.push(this.a.toFixed(2));
                    chart.update();
                }
            }
            this.draw();
        }
    };

    function handleResize() {
        // Sync canvas attributes with its CSS-defined size
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        // Reset the simulation to adapt to the new size
        simulation.reset();
    }

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Initial setup
    simulation.init();
    handleResize(); // Perform initial resize to set everything up

    // Add resize listener
    window.addEventListener('resize', debounce(handleResize, 100));

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
            navigator.clipboard.writeText(url).then(() => {
                alert("Link do experimento copiado para a área de transferência!");
            }, () => {
                alert("Copie e compartilhe este link: " + url);
            });
        }
    };
});
