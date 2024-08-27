document.addEventListener('DOMContentLoaded', () => {
    AOS.init();

    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const convertButton = document.getElementById('convertButton');
    const result = document.getElementById('result');
    const loading = document.getElementById('loading');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('highlight');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('highlight'));
    dropzone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    convertButton.addEventListener('click', convertFile);

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('highlight');
        handleFiles(e.dataTransfer.files);
    }

    function handleFileSelect(e) {
        handleFiles(e.target.files);
    }

    function handleFiles(files) {
        fileInput.files = files;
        dropzone.innerHTML = `
            <i class="fas fa-file-alt"></i>
            <p>Selected file: ${files[0].name}</p>
        `;
        gsap.from(dropzone.children, {
            opacity: 0,
            y: 20,
            stagger: 0.2,
            duration: 0.5,
            ease: 'power2.out'
        });
    }

    async function convertFile() {
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('outputFormat', document.getElementById('outputFormat').value);
        formData.append('compress', document.getElementById('compress').checked);
        formData.append('width', document.getElementById('width').value);
        formData.append('height', document.getElementById('height').value);

        loading.style.display = 'block';
        result.textContent = '';

        gsap.to(convertButton, {
            scale: 0.9,
            duration: 0.1,
            yoyo: true,
            repeat: 1
        });

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            result.innerHTML = `<a href="${data.downloadUrl}" download>Download converted file</a>`;
            gsap.from(result.children, {
                opacity: 0,
                y: 20,
                duration: 0.5,
                ease: 'power2.out'
            });
        } catch (error) {
            console.error('Error:', error);
            result.textContent = 'An error occurred during conversion.';
        } finally {
            loading.style.display = 'none';
        }
    }
});