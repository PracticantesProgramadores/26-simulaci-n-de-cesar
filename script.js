document.addEventListener('DOMContentLoaded', function() {
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    const startBtn = document.getElementById('start-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const difficultySelect = document.getElementById('difficulty');
    const timerDisplay = document.getElementById('timer');
    const puzzleBoard = document.getElementById('puzzle-board');
    const piecesContainer = document.getElementById('pieces-container');
    const resultTime = document.getElementById('result-time');
    const resultRating = document.getElementById('result-rating');

    let gridSize = 3;
    let imageSrc = '';
    let pieces = [];
    let boardPieces = [];
    let timerInterval;
    let startTime;
    let isComplete = false;
    let scaledPieceWidth, scaledPieceHeight;
    let selectedImage = 'japon'; // Imagen por defecto

    const artData = {
        'japon': {
            src: 'japon-antiguo-en-el-estilo-de-arte-digital.jpg',
            title: 'Japón Antiguo en Estilo de Arte Digital',
            author: 'Desconocido',
            style: 'Arte Digital',
            technique: 'Digital',
            questions: [
                '¿Qué elementos tradicionales japoneses puedes identificar?',
                '¿Qué emociones transmite la imagen?',
                '¿Cómo combina lo antiguo con lo moderno?'
            ],
            info: 'Esta imagen representa elementos de la cultura japonesa antigua en un estilo artístico digital.'
        },
        'rio': {
            src: 'ilustracion-vibrante-de-una-comunidad-de-favela-amarilla-en-rio-de-janeiro-brasil-capturando-el-colorido.jpg',
            title: 'Favela en Río de Janeiro',
            author: 'Desconocido',
            style: 'Ilustración Digital',
            technique: 'Digital',
            questions: [
                '¿Qué aspectos de la cultura y arquitectura carioca observas?',
                '¿Cómo se representa la vida comunitaria en las favelas?',
                '¿Qué colores predominan y qué simbolizan sobre Río de Janeiro?'
            ],
            info: 'Esta ilustración vibrante captura la esencia de las comunidades de favelas en Río de Janeiro, Brasil. Muestra la arquitectura característica, los colores brillantes y la vida dinámica de estos barrios que son parte fundamental de la identidad cultural de la ciudad maravillosa.'
        },
        'choco': {
            src: 'foto del choco quibdo.avif',
            title: 'Quibdó, Chocó',
            author: 'Desconocido',
            style: 'Fotografía',
            technique: 'Fotografía',
            questions: [
                '¿Qué características del paisaje chocoano puedes identificar?',
                '¿Cómo se refleja la cultura afrocolombiana en la imagen?',
                '¿Qué aspectos de Quibdó y el Chocó te llaman más la atención?'
            ],
            info: 'Esta imagen representa a Quibdó, capital del departamento del Chocó en Colombia. El Chocó es conocido por su inmensa biodiversidad, sus ríos caudalosos, su rica cultura afrocolombiana y sus tradiciones musicales únicas. Es una región que combina naturaleza exuberante con una herencia cultural profunda.'
        }
    };

    startBtn.addEventListener('click', startGame);
    playAgainBtn.addEventListener('click', resetGame);

    // Event listeners para selección de imagen
    const imageOptions = document.querySelectorAll('.image-option');
    imageOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remover selección previa
            imageOptions.forEach(opt => opt.classList.remove('selected'));
            // Agregar selección a la opción clickeada
            this.classList.add('selected');
            // Guardar la imagen seleccionada
            selectedImage = this.dataset.image;
        });
    });

    function startGame() {
        console.log('Iniciando juego con imagen:', selectedImage);
        gridSize = parseInt(difficultySelect.value);
        imageSrc = artData[selectedImage].src;
        console.log('Ruta de imagen:', imageSrc);

        startScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        initializePuzzle();
        startTimer();
    }

    function initializePuzzle() {
        puzzleBoard.innerHTML = '';
        piecesContainer.innerHTML = '';
        pieces = [];
        boardPieces = [];
        isComplete = false;

        const img = new Image();
        img.onload = function() {
            const pieceWidth = img.width / gridSize;
            const pieceHeight = img.height / gridSize;

            // Scale down for better display
            const scale = Math.min(400 / img.width, 400 / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            scaledPieceWidth = scaledWidth / gridSize;
            scaledPieceHeight = scaledHeight / gridSize;

            puzzleBoard.style.width = scaledWidth + 'px';
            puzzleBoard.style.height = scaledHeight + 'px';

            for (let i = 0; i < gridSize * gridSize; i++) {
                const row = Math.floor(i / gridSize);
                const col = i % gridSize;

                const piece = document.createElement('div');
                piece.className = 'piece';
                piece.style.width = scaledPieceWidth + 'px';
                piece.style.height = scaledPieceHeight + 'px';
                piece.dataset.correctRow = row;
                piece.dataset.correctCol = col;
                piece.dataset.currentRow = -1;
                piece.dataset.currentCol = -1;

                // Create canvas for the piece
                const canvas = document.createElement('canvas');
                canvas.width = pieceWidth;
                canvas.height = pieceHeight;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.pointerEvents = 'none';
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, col * pieceWidth, row * pieceHeight, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);
                piece.appendChild(canvas);

                pieces.push(piece);
                piecesContainer.appendChild(piece);

                piece.addEventListener('mousedown', startDrag);
                piece.addEventListener('touchstart', startDrag, { passive: false });
            }

            shufflePieces();
        };
        img.src = imageSrc;
    }

    function shufflePieces() {
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }
        pieces.forEach(piece => {
            piecesContainer.appendChild(piece);
        });
    }

    let draggedPiece = null;
    let offsetX, offsetY;
    let isDragging = false;

    function startDrag(e) {
        e.preventDefault();
        
        const touch = e.type === 'touchstart' ? e.touches[0] : e;
        draggedPiece = e.currentTarget;
        
        if (!draggedPiece) return;
        
        isDragging = true;
        
        // Esconder el cursor
        document.body.style.cursor = 'none';
        
        // Offset 0 - la pieza pegada completamente al cursor
        offsetX = 0;
        offsetY = 0;

        // Hacer la pieza draggable
        draggedPiece.style.position = 'fixed';
        draggedPiece.style.zIndex = '1000';
        draggedPiece.style.transition = 'none';
        draggedPiece.style.pointerEvents = 'none';
        draggedPiece.style.opacity = '0.95';
        draggedPiece.style.cursor = 'none';
        draggedPiece.style.filter = 'brightness(1.1)';
        
        // Posición completamente pegada al cursor (esquina superior izquierda)
        draggedPiece.style.left = touch.clientX + 'px';
        draggedPiece.style.top = touch.clientY + 'px';
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', endDrag);
    }

    function drag(e) {
        if (!isDragging || !draggedPiece) return;
        
        e.preventDefault();
        const touch = e.type === 'touchmove' ? e.touches[0] : e;
        
        // Actualización completamente pegada al cursor
        requestAnimationFrame(() => {
            if (draggedPiece) {
                draggedPiece.style.left = touch.clientX + 'px';
                draggedPiece.style.top = touch.clientY + 'px';
            }
        });
    }

    function endDrag(e) {
        if (!draggedPiece || !isDragging) return;
        
        e.preventDefault();
        isDragging = false;
        
        // Restaurar el cursor
        document.body.style.cursor = '';
        
        const touch = e.type === 'touchend' ? e.changedTouches[0] : e;
        
        const boardRect = puzzleBoard.getBoundingClientRect();
        const pieceRect = draggedPiece.getBoundingClientRect();
        const centerX = pieceRect.left + pieceRect.width / 2;
        const centerY = pieceRect.top + pieceRect.height / 2;

        // Restaurar transiciones y opacidad
        draggedPiece.style.transition = '';
        draggedPiece.style.pointerEvents = '';
        draggedPiece.style.opacity = '1';
        draggedPiece.style.filter = '';

        if (centerX >= boardRect.left && centerX <= boardRect.right &&
            centerY >= boardRect.top && centerY <= boardRect.bottom) {
            // Place on board
            const col = Math.floor((centerX - boardRect.left) / scaledPieceWidth);
            const row = Math.floor((centerY - boardRect.top) / scaledPieceHeight);

            // Check if there's already a piece at this position
            const existingPiece = Array.from(puzzleBoard.children).find(p => 
                parseInt(p.dataset.currentRow) === row && parseInt(p.dataset.currentCol) === col
            );
            
            if (existingPiece) {
                // Devolver la pieza existente al contenedor
                existingPiece.dataset.currentRow = -1;
                existingPiece.dataset.currentCol = -1;
                existingPiece.style.position = 'static';
                existingPiece.style.zIndex = 'auto';
                existingPiece.style.left = '';
                existingPiece.style.top = '';
                piecesContainer.appendChild(existingPiece);
            }

            // Colocar la nueva pieza
            draggedPiece.dataset.currentRow = row;
            draggedPiece.dataset.currentCol = col;
            draggedPiece.style.position = 'absolute';
            draggedPiece.style.left = (col * scaledPieceWidth) + 'px';
            draggedPiece.style.top = (row * scaledPieceHeight) + 'px';
            puzzleBoard.appendChild(draggedPiece);
        } else {
            // Return to pieces container
            draggedPiece.dataset.currentRow = -1;
            draggedPiece.dataset.currentCol = -1;
            draggedPiece.style.position = 'static';
            draggedPiece.style.zIndex = 'auto';
            draggedPiece.style.left = '';
            draggedPiece.style.top = '';
            piecesContainer.appendChild(draggedPiece);
        }

        draggedPiece = null;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', endDrag);
        
        checkCompletion();
    }

    function checkCompletion() {
        const boardPieces = Array.from(puzzleBoard.children);
        if (boardPieces.length === gridSize * gridSize) {
            let complete = true;
            boardPieces.forEach(piece => {
                if (parseInt(piece.dataset.correctRow) !== parseInt(piece.dataset.currentRow) ||
                    parseInt(piece.dataset.correctCol) !== parseInt(piece.dataset.currentCol)) {
                    complete = false;
                }
            });
            if (complete && !isComplete) {
                isComplete = true;
                stopTimer();
                showResults();
            }
        }
    }

    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timerDisplay.textContent = `Tiempo: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function showResults() {
        gameScreen.style.display = 'none';
        resultScreen.style.display = 'block';

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        resultTime.textContent = `Tiempo total: ${minutes} minutos y ${seconds} segundos`;

        let rating = 'Puede mejorar';
        if (elapsed < 60) rating = 'Excelente';
        else if (elapsed < 180) rating = 'Bien';
        resultRating.textContent = `Clasificación: ${rating}`;

        if (artData[selectedImage]) {
            const data = artData[selectedImage];
            document.getElementById('question1').textContent = data.questions[0];
            document.getElementById('question2').textContent = data.questions[1];
            document.getElementById('question3').textContent = data.questions[2];
            document.getElementById('art-info').textContent = `Información: ${data.info}`;
        }
    }

    function resetGame() {
        resultScreen.style.display = 'none';
        startScreen.style.display = 'block';
        stopTimer();
        timerDisplay.textContent = 'Tiempo: 00:00';
    }
});
