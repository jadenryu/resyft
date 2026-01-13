pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentPDF = null;
let segments = [];
let docAnalysisOutput = []; // Stores analyzed text chunks
let annotationsInput = []; // Stores text to display in sidebar
let selectedSegmentIndex = null;
let scale = 1.5;
let currentTool = null;
let isDrawing = false;
let startX, startY;
let currentContainer = null;
let highlightColor = 'yellow';
let userAnnotations = [];
let selectedTextbox = null;
let activeResize = null;
let pdfDimensions = {}; // Store original PDF dimensions per page

const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const pdfViewer = document.getElementById('pdfViewer');
const emptyState = document.getElementById('emptyState');
const loading = document.getElementById('loading');
const annotationsList = document.getElementById('annotationsList');
const segmentCount = document.getElementById('segmentCount');
const controls = document.getElementById('controls');
const fileName = document.getElementById('fileName');
const zoomIn = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');
const zoomLevel = document.getElementById('zoomLevel');
const highlightBtn = document.getElementById('highlightBtn');
const textboxBtn = document.getElementById('textboxBtn');
const colorPicker = document.getElementById('colorPicker');

uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileUpload);

// Auto-load existing document on page load
window.addEventListener('DOMContentLoaded', () => {
    loadExistingDoc();
});

async function loadExistingDoc() {
    loading.classList.add('active');
    uploadBtn.disabled = true;

    try {
        const response = await fetch('/api/analyze-existing', {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            currentPDF = result.pdfData;
            
            // Filter out footers and page numbers
            segments = result.segments.filter(seg => 
                seg.type !== 'Page footer' && 
                seg.type !== 'Page number' &&
                seg.type !== 'Page header'
            );
            
            // Create docAnalysisOutput from segments
            docAnalysisOutput = segments.map(seg => seg.text || '').filter(text => text.trim() !== '');
            
            // Copy to annotationsInput
            annotationsInput = [...docAnalysisOutput];
            
            fileName.textContent = result.filename;
            controls.style.display = 'flex';
            userAnnotations = [];
            await renderPDF();
            renderAnnotations();
            
            console.log('docAnalysisOutput:', docAnalysisOutput);
            console.log('annotationsInput:', annotationsInput);
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert(`Error loading document: ${error.message}`);
    } finally {
        loading.classList.remove('active');
        uploadBtn.disabled = false;
    }
}

document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        highlightColor = this.dataset.color;
    });
});
document.querySelector('.color-option').classList.add('selected');

highlightBtn.addEventListener('click', () => toggleTool('highlight'));
textboxBtn.addEventListener('click', () => toggleTool('textbox'));

zoomIn.addEventListener('click', () => {
    scale += 0.25;
    if (currentPDF) renderPDF();
});

zoomOut.addEventListener('click', () => {
    if (scale > 0.5) {
        scale -= 0.25;
        if (currentPDF) renderPDF();
    }
});

function toggleTool(tool) {
    if (currentTool === tool) {
        currentTool = null;
        highlightBtn.classList.remove('active');
        textboxBtn.classList.remove('active');
        colorPicker.classList.remove('active');
        pdfViewer.style.cursor = 'default';
    } else {
        currentTool = tool;
        highlightBtn.classList.toggle('active', tool === 'highlight');
        textboxBtn.classList.toggle('active', tool === 'textbox');
        colorPicker.classList.toggle('active', tool === 'highlight');
        pdfViewer.style.cursor = tool === 'highlight' ? 'crosshair' : 'cell';
    }
}

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    loading.classList.add('active');
    uploadBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            currentPDF = result.pdfData;
            
            // Filter out footers and page numbers
            segments = result.segments.filter(seg => 
                seg.type !== 'Page footer' && 
                seg.type !== 'Page number' &&
                seg.type !== 'Page header'
            );
            
            // Create docAnalysisOutput from segments
            docAnalysisOutput = segments.map(seg => seg.text || '').filter(text => text.trim() !== '');
            
            // Copy to annotationsInput
            annotationsInput = [...docAnalysisOutput];
            
            fileName.textContent = result.filename;
            controls.style.display = 'flex';
            userAnnotations = []; // Reset annotations on new upload
            await renderPDF();
            renderAnnotations();
            
            console.log('docAnalysisOutput:', docAnalysisOutput);
            console.log('annotationsInput:', annotationsInput);
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    } finally {
        loading.classList.remove('active');
        uploadBtn.disabled = false;
    }
}

async function renderPDF() {
    emptyState.style.display = 'none';
    pdfViewer.innerHTML = '';
    pdfDimensions = {};

    const pdfData = atob(currentPDF);
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Store original dimensions
        if (!pdfDimensions[pageNum]) {
            const originalViewport = page.getViewport({ scale: 1.0 });
            pdfDimensions[pageNum] = {
                width: originalViewport.width,
                height: originalViewport.height
            };
        }

        const container = document.createElement('div');
        container.className = 'pdf-canvas-container';
        container.style.position = 'relative';
        container.dataset.page = pageNum;

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;

        container.appendChild(canvas);
        pdfViewer.appendChild(container);

        container.addEventListener('mousedown', (e) => handleMouseDown(e, container, pageNum));
        container.addEventListener('mousemove', (e) => handleMouseMove(e, container));
        container.addEventListener('mouseup', (e) => handleMouseUp(e, container, pageNum));

        // Add segment overlays
        const pageSegments = segments.filter(s => s.page_number === pageNum);
        pageSegments.forEach((segment, index) => {
            const overlay = createSegmentOverlay(segment, viewport, index, pageNum);
            container.appendChild(overlay);
        });

        // Re-add user annotations with proper scaling
        const pageAnnotations = userAnnotations.filter(a => a.page === pageNum);
        pageAnnotations.forEach(annotation => {
            if (annotation.type === 'highlight') {
                const highlight = createHighlight(annotation, container, pageNum);
                container.appendChild(highlight);
            } else if (annotation.type === 'textbox') {
                const textbox = createTextbox(annotation, container, pageNum);
                container.appendChild(textbox);
            }
        });
    }

    zoomLevel.textContent = `${Math.round(scale * 100)}%`;
}

function handleMouseDown(e, container, pageNum) {
    if (!currentTool) return;
    if (e.target !== container && !e.target.classList.contains('pdf-canvas-container') && e.target.tagName !== 'CANVAS') return;

    isDrawing = true;
    currentContainer = container;
    const rect = container.getBoundingClientRect();
    
    // Calculate relative position (0-1 range)
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    
    startX = relX;
    startY = relY;

    if (currentTool === 'textbox') {
        const annotation = {
            type: 'textbox',
            page: pageNum,
            relX: relX,
            relY: relY,
            relWidth: 150 / rect.width,
            relHeight: 50 / rect.height,
            text: ''
        };
        userAnnotations.push(annotation);
        const textbox = createTextbox(annotation, container, pageNum);
        container.appendChild(textbox);
        textbox.querySelector('textarea').focus();
        isDrawing = false;
        currentTool = null;
        textboxBtn.classList.remove('active');
        pdfViewer.style.cursor = 'default';
    }
}

function handleMouseMove(e, container) {
    if (!isDrawing || currentTool !== 'highlight') return;

    const rect = container.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    const temp = container.querySelector('.temp-highlight');
    if (temp) temp.remove();

    const highlight = document.createElement('div');
    highlight.className = 'user-highlight temp-highlight';
    highlight.style.left = (Math.min(startX, relX) * rect.width) + 'px';
    highlight.style.top = (Math.min(startY, relY) * rect.height) + 'px';
    highlight.style.width = (Math.abs(relX - startX) * rect.width) + 'px';
    highlight.style.height = (Math.abs(relY - startY) * rect.height) + 'px';
    highlight.style.background = getHighlightColor(highlightColor);
    container.appendChild(highlight);
}

function handleMouseUp(e, container, pageNum) {
    if (!isDrawing || currentTool !== 'highlight') return;

    const rect = container.getBoundingClientRect();
    const relEndX = (e.clientX - rect.left) / rect.width;
    const relEndY = (e.clientY - rect.top) / rect.height;

    const temp = container.querySelector('.temp-highlight');
    if (temp) temp.remove();

    if (Math.abs(relEndX - startX) > 0.01 && Math.abs(relEndY - startY) > 0.01) {
        const annotation = {
            type: 'highlight',
            page: pageNum,
            relX: Math.min(startX, relEndX),
            relY: Math.min(startY, relEndY),
            relWidth: Math.abs(relEndX - startX),
            relHeight: Math.abs(relEndY - startY),
            color: highlightColor
        };
        userAnnotations.push(annotation);
        const highlight = createHighlight(annotation, container, pageNum);
        container.appendChild(highlight);
    }

    isDrawing = false;
}

function createSegmentOverlay(segment, viewport, globalIndex, pageNum) {
    const overlay = document.createElement('div');
    overlay.className = 'segment-overlay';
    overlay.dataset.index = segments.indexOf(segment);

    const scaleX = viewport.width / segment.page_width;
    const scaleY = viewport.height / segment.page_height;

    overlay.style.left = (segment.left * scaleX) + 'px';
    overlay.style.top = (segment.top * scaleY) + 'px';
    overlay.style.width = (segment.width * scaleX) + 'px';
    overlay.style.height = (segment.height * scaleY) + 'px';
    
     // Check if text contains warning
    const containsWarning = segment.text && segment.text.toLowerCase().includes('name');
    
    if (containsWarning) {
        overlay.style.borderColor = '#EF4444'; // Red color
        overlay.classList.add('contains-warning');
    } else {
        overlay.style.borderColor = getColorForType(segment.type);
    }

    overlay.addEventListener('click', () => selectSegment(segments.indexOf(segment)));

    return overlay;
}

function renderAnnotations() {
    annotationsList.innerHTML = '';
    segmentCount.textContent = `${annotationsInput.length} segments`;

    const sortedSegments = [...segments].sort((a, b) => {
        if (a.page_number !== b.page_number) {
            return a.page_number - b.page_number;
        }
        return a.top - b.top;
    });

    sortedSegments.forEach((segment) => {
        const originalIndex = segments.indexOf(segment);
        const item = document.createElement('div');
        item.className = 'annotation-item';
        item.dataset.index = originalIndex;

        const containsWarning = segment.text && segment.text.toLowerCase().includes('name');

        const color = containsWarning ? '#EF4444' : getColorForType(segment.type);
        item.style.borderLeftColor = color;

        if (containsWarning) {
            item.classList.add('contains-warning');
        }

        item.innerHTML = `
            <div class="annotation-page">Page ${segment.page_number}</div>
            <div class="annotation-text">${segment.text || '(No text)'}</div>
        `;

        item.addEventListener('click', () => selectSegment(originalIndex));
        annotationsList.appendChild(item);
    });
}

function selectSegment(index) {
    selectedSegmentIndex = index;
    const segment = segments[index];

    document.querySelectorAll('.annotation-item').forEach((item, i) => {
        item.classList.toggle('selected', parseInt(item.dataset.index) === index);
    });

    document.querySelectorAll('.segment-overlay').forEach(overlay => {
        const overlayIndex = parseInt(overlay.dataset.index);
        overlay.classList.toggle('selected', overlayIndex === index);
    });

    const selectedAnnotation = document.querySelector('.annotation-item.selected');
    if (selectedAnnotation) {
        selectedAnnotation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const selectedOverlay = document.querySelector('.segment-overlay.selected');
    if (selectedOverlay) {
        const container = selectedOverlay.parentElement;
        const viewerRect = pdfViewer.getBoundingClientRect();
        const overlayRect = selectedOverlay.getBoundingClientRect();
        
        // Calculate scroll position to show the overlay with some padding from top
        const padding = 100; // pixels from top of viewer
        const targetScrollTop = pdfViewer.scrollTop + (overlayRect.top - viewerRect.top) - padding;
        
        // Get the maximum possible scroll (total scroll height minus visible height)
        const maxScroll = pdfViewer.scrollHeight - pdfViewer.clientHeight;
        
        // Clamp the scroll position to valid range
        const clampedScrollTop = Math.max(0, Math.min(targetScrollTop, maxScroll));
        
        pdfViewer.scrollTo({
            top: clampedScrollTop,
            behavior: 'smooth'
        });
    }
}

function createHighlight(annotation, container, pageNum) {
    const rect = container.getBoundingClientRect();
    
    const highlight = document.createElement('div');
    highlight.className = 'user-highlight';
    highlight.style.left = (annotation.relX * rect.width) + 'px';
    highlight.style.top = (annotation.relY * rect.height) + 'px';
    highlight.style.width = (annotation.relWidth * rect.width) + 'px';
    highlight.style.height = (annotation.relHeight * rect.height) + 'px';
    highlight.style.background = getHighlightColor(annotation.color);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        const index = userAnnotations.indexOf(annotation);
        if (index > -1) userAnnotations.splice(index, 1);
        highlight.remove();
    };
    highlight.appendChild(deleteBtn);

    makeHighlightDraggable(highlight, annotation, container, pageNum);
    return highlight;
}

function makeHighlightDraggable(element, annotation, container, pageNum) {
    let isDragging = false;
    let offsetX, offsetY;

    element.onmousedown = (e) => {
        if (e.target.classList.contains('delete-btn')) return;
        isDragging = true;
        const rect = container.getBoundingClientRect();
        offsetX = (e.clientX - rect.left) / rect.width - annotation.relX;
        offsetY = (e.clientY - rect.top) / rect.height - annotation.relY;
        e.preventDefault();
    };

    document.onmousemove = (e) => {
        if (!isDragging) return;
        const rect = container.getBoundingClientRect();
        annotation.relX = Math.max(0, Math.min(1 - annotation.relWidth, (e.clientX - rect.left) / rect.width - offsetX));
        annotation.relY = Math.max(0, Math.min(1 - annotation.relHeight, (e.clientY - rect.top) / rect.height - offsetY));
        element.style.left = (annotation.relX * rect.width) + 'px';
        element.style.top = (annotation.relY * rect.height) + 'px';
    };

    document.onmouseup = () => {
        isDragging = false;
    };
}

function createTextbox(annotation, container, pageNum) {
    const rect = container.getBoundingClientRect();
    
    const textbox = document.createElement('div');
    textbox.className = 'user-textbox';
    textbox.style.left = (annotation.relX * rect.width) + 'px';
    textbox.style.top = (annotation.relY * rect.height) + 'px';
    textbox.style.width = (annotation.relWidth * rect.width) + 'px';
    textbox.style.height = (annotation.relHeight * rect.height) + 'px';

    const dragHandle = document.createElement('div');
    dragHandle.className = 'textbox-drag-handle';
    textbox.appendChild(dragHandle);

    const textarea = document.createElement('textarea');
    textarea.value = annotation.text || '';
    textarea.placeholder = 'Type your note here...';
    textarea.oninput = () => {
        annotation.text = textarea.value;
    };
    textarea.onclick = (e) => {
        e.stopPropagation();
        selectTextbox(textbox, annotation);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        const index = userAnnotations.indexOf(annotation);
        if (index > -1) userAnnotations.splice(index, 1);
        textbox.remove();
        if (selectedTextbox === textbox) selectedTextbox = null;
    };

    const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
    handles.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `textbox-handle handle-${pos}`;
        handle.dataset.position = pos;
        handle.onmousedown = (e) => {
            e.stopPropagation();
            startResize(e, textbox, annotation, container, pos, pageNum);
        };
        textbox.appendChild(handle);
    });

    textbox.appendChild(textarea);
    textbox.appendChild(deleteBtn);

    textbox.onclick = (e) => {
        if (e.target === textarea) return;
        selectTextbox(textbox, annotation);
    };

    dragHandle.onmousedown = (e) => {
        e.preventDefault();
        startDrag(e, textbox, annotation, container, pageNum);
    };

    return textbox;
}

function selectTextbox(textbox, annotation) {
    document.querySelectorAll('.user-textbox').forEach(tb => {
        tb.classList.remove('selected');
    });
    textbox.classList.add('selected');
    selectedTextbox = textbox;
}

function startDrag(e, textbox, annotation, container, pageNum) {
    selectTextbox(textbox, annotation);
    const rect = container.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left) / rect.width - annotation.relX;
    const offsetY = (e.clientY - rect.top) / rect.height - annotation.relY;

    const onMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        annotation.relX = Math.max(0, Math.min(1 - annotation.relWidth, (e.clientX - rect.left) / rect.width - offsetX));
        annotation.relY = Math.max(0, Math.min(1 - annotation.relHeight, (e.clientY - rect.top) / rect.height - offsetY));
        textbox.style.left = (annotation.relX * rect.width) + 'px';
        textbox.style.top = (annotation.relY * rect.height) + 'px';
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function startResize(e, textbox, annotation, container, position, pageNum) {
    e.preventDefault();
    selectTextbox(textbox, annotation);

    const rect = container.getBoundingClientRect();
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startRelX = annotation.relX;
    const startRelY = annotation.relY;
    const startRelWidth = annotation.relWidth;
    const startRelHeight = annotation.relHeight;

    const onMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        const deltaX = (e.clientX - startMouseX) / rect.width;
        const deltaY = (e.clientY - startMouseY) / rect.height;

        const minWidth = 100 / rect.width;
        const minHeight = 50 / rect.height;

        if (position.includes('e')) {
            annotation.relWidth = Math.max(minWidth, startRelWidth + deltaX);
        }
        if (position.includes('w')) {
            const newWidth = Math.max(minWidth, startRelWidth - deltaX);
            const widthDiff = startRelWidth - newWidth;
            annotation.relX = startRelX + widthDiff;
            annotation.relWidth = newWidth;
        }
        if (position.includes('s')) {
            annotation.relHeight = Math.max(minHeight, startRelHeight + deltaY);
        }
        if (position.includes('n')) {
            const newHeight = Math.max(minHeight, startRelHeight - deltaY);
            const heightDiff = startRelHeight - newHeight;
            annotation.relY = startRelY + heightDiff;
            annotation.relHeight = newHeight;
        }

        textbox.style.left = (annotation.relX * rect.width) + 'px';
        textbox.style.top = (annotation.relY * rect.height) + 'px';
        textbox.style.width = (annotation.relWidth * rect.width) + 'px';
        textbox.style.height = (annotation.relHeight * rect.height) + 'px';
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-textbox')) {
        document.querySelectorAll('.user-textbox').forEach(tb => {
            tb.classList.remove('selected');
        });
        selectedTextbox = null;
    }
});

function getHighlightColor(colorName) {
    const colors = {
        'yellow': 'rgba(255, 255, 0, 0.4)',
        'green': 'rgba(0, 255, 0, 0.4)',
        'pink': 'rgba(255, 0, 255, 0.4)',
        'cyan': 'rgba(0, 255, 255, 0.4)'
    };
    return colors[colorName] || colors.yellow;
}

function getColorForType(type) {
    const colors = {
        'Title': '#5b7a9e',
        'Text': '#6b8ca8',
        'Table': '#7d95aa',
        'Picture': '#8fa0ad',
        'Formula': '#a45860',
        'List item': '#95a5b0',
        'Section header': '#4d6b8a',
        'Caption': '#7f8e9c',
        'Footnote': '#909fa9',
        'Page header': '#5d7590',
        'Page footer': '#8b9aa5'
    };
    return colors[type] || '#6b8ca8';
}