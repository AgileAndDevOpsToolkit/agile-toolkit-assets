(() => {
  const DATA_FILE = 'videos-metadata.json';

  const state = {
    data: [],
    initialJson: '',
    selectedSerieIndex: 0,
    selectedVideoIndex: 0,
    dirty: false,
    saving: false,
  };

  const el = {
    saveStatus: document.getElementById('saveStatus'),
    saveBtn: document.getElementById('saveBtn'),
    reloadBtn: document.getElementById('reloadBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    addVideoBtn: document.getElementById('addVideoBtn'),
    seriesButtons: document.getElementById('seriesButtons'),
    videoList: document.getElementById('videoList'),
    editorForm: document.getElementById('editorForm'),
    toast: document.getElementById('toast'),
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    el.saveBtn.addEventListener('click', saveData);
    el.reloadBtn.addEventListener('click', reloadData);
    el.downloadBtn.addEventListener('click', downloadJson);
    el.addVideoBtn.addEventListener('click', addVideo);

    window.addEventListener('beforeunload', (event) => {
      if (state.dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    });

    loadData();
  }

  async function loadData() {
    setStatus('Chargement…', 'loading');
    el.saveBtn.disabled = true;

    try {
      const response = await fetch(`${DATA_FILE}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Impossible de charger ${DATA_FILE} (${response.status})`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Le JSON doit contenir un tableau de séries à la racine.');
      }

      state.data = normalizeData(data);
      state.initialJson = stringifyData(state.data);
      state.selectedSerieIndex = 0;
      state.selectedVideoIndex = 0;
      updateDirtyState();
      render();
      setStatus('Données chargées', 'saved');
    } catch (error) {
      setStatus(error.message, 'error');
      showToast(error.message);
    }
  }

  function normalizeData(data) {
    return data.map((serie, serieIndex) => ({
      serie: String(serie.serie ?? `Série ${serieIndex + 1}`),
      videos: Array.isArray(serie.videos)
        ? serie.videos.map(normalizeVideo)
        : [],
    }));
  }

  function normalizeVideo(video = {}) {
    return {
      id_youtube: String(video.id_youtube ?? ''),
      titre: String(video.titre ?? ''),
      'description-courte': String(video['description-courte'] ?? ''),
      'description-moyenne': String(video['description-moyenne'] ?? ''),
      'mots-cles': Array.isArray(video['mots-cles']) ? video['mots-cles'].map(String) : [],
      'questions-repondues': Array.isArray(video['questions-repondues']) ? video['questions-repondues'].map(String) : [],
    };
  }

  function render() {
    clampSelection();
    renderSeriesButtons();
    renderVideoList();
    renderEditor();
  }

  function clampSelection() {
    if (!state.data.length) {
      state.selectedSerieIndex = -1;
      state.selectedVideoIndex = -1;
      return;
    }

    state.selectedSerieIndex = Math.min(Math.max(state.selectedSerieIndex, 0), state.data.length - 1);
    const videos = currentSerie().videos;

    if (!videos.length) {
      state.selectedVideoIndex = -1;
      return;
    }

    state.selectedVideoIndex = Math.min(Math.max(state.selectedVideoIndex, 0), videos.length - 1);
  }

  function currentSerie() {
    return state.data[state.selectedSerieIndex];
  }

  function currentVideo() {
    const serie = currentSerie();
    return serie?.videos?.[state.selectedVideoIndex];
  }

  function renderSeriesButtons() {
    el.seriesButtons.innerHTML = '';

    state.data.forEach((serie, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `btn series-button${index === state.selectedSerieIndex ? ' active' : ''}`;
      button.textContent = serie.serie || `Série ${index + 1}`;
      button.title = serie.serie;
      button.addEventListener('click', () => {
        state.selectedSerieIndex = index;
        state.selectedVideoIndex = 0;
        render();
      });
      el.seriesButtons.appendChild(button);
    });
  }

  function renderVideoList() {
    el.videoList.innerHTML = '';
    const serie = currentSerie();

    if (!serie) {
      el.videoList.innerHTML = '<p class="empty-state">Aucune série.</p>';
      return;
    }

    if (!serie.videos.length) {
      el.videoList.innerHTML = '<p class="empty-state">Aucune vidéo dans cette série.</p>';
      return;
    }

    serie.videos.forEach((video, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `video-item${index === state.selectedVideoIndex ? ' active' : ''}`;
      button.innerHTML = `
        <span class="video-title"></span>
        <span class="video-id"></span>
      `;
      button.querySelector('.video-title').textContent = video.titre || 'Vidéo sans titre';
      button.querySelector('.video-id').textContent = video.id_youtube || 'Sans id_youtube';
      button.addEventListener('click', () => {
        state.selectedVideoIndex = index;
        renderEditor();
        renderVideoList();
      });
      el.videoList.appendChild(button);
    });
  }

  function renderEditor() {
    const serie = currentSerie();
    const video = currentVideo();

    if (!serie || !video) {
      el.editorForm.hidden = true;
      return;
    }

    el.editorForm.hidden = false;
    el.editorForm.innerHTML = '';

    if (video.id_youtube) {
      const embedContainer = document.createElement('div');
      embedContainer.className = 'youtube-embed-container';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${video.id_youtube}`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.title = 'Embedded YouTube video';
      embedContainer.appendChild(iframe);
      el.editorForm.appendChild(embedContainer);
    }

    const videoCard = createCard('Vidéo sélectionnée');
    videoCard.content.append(
      createField({ label: 'id_youtube', value: video.id_youtube, singleLine: true, onChange: (value) => updateVideoField('id_youtube', value, true) }),
      createField({ label: 'titre', value: video.titre, singleLine: true, onChange: (value) => updateVideoField('titre', value, true) }),
      createField({ label: 'description-courte', value: video['description-courte'], onChange: (value) => updateVideoField('description-courte', value) }),
      createField({ label: 'description-moyenne', value: video['description-moyenne'], onChange: (value) => updateVideoField('description-moyenne', value) })
    );

    el.editorForm.appendChild(videoCard.card);

    el.editorForm.appendChild(createKeywordsEditor(
      video['mots-cles'],
      (items) => updateVideoField('mots-cles', items),
    ));

    el.editorForm.appendChild(createQuestionsEditor(
      video['questions-repondues'],
      (items) => updateVideoField('questions-repondues', items),
    ));
  }

  function createCard(title) {
    const card = document.createElement('section');
    card.className = 'section-card';

    const header = document.createElement('div');
    header.className = 'section-title';

    const h3 = document.createElement('h3');
    h3.textContent = title;
    header.appendChild(h3);

    const content = document.createElement('div');
    content.className = 'form-grid';

    card.append(header, content);
    return { card, content };
  }

  function createField({ label, value, singleLine = false, onChange }) {
    const row = document.createElement('div');
    row.className = 'field-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'field-label';
    labelEl.textContent = label;

    const control = document.createElement('div');
    control.className = 'field-control';

    const input = singleLine ? document.createElement('input') : document.createElement('textarea');
    if (singleLine) input.type = 'text';
    input.value = value ?? '';
    input.addEventListener('input', () => onChange(input.value));
    control.appendChild(input);

    const actions = document.createElement('div');
    actions.className = 'field-actions';
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-small keywords-copy-btn';
    copyBtn.textContent = '📋';
    copyBtn.title = 'Copier';
    copyBtn.addEventListener('click', () => copyText(input.value));
    actions.appendChild(copyBtn);

    row.append(labelEl, control, actions);
    return row;
  }

  function createKeywordsEditor(items, onChange) {
    const { card, content } = createCard('Mots-clés');

    const header = card.querySelector('.section-title');
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-small keywords-copy-btn';
    copyBtn.textContent = '📋';
    copyBtn.title = 'Copier les mots-clés';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = items.map(k => `#${k}`).join(' ');
    input.placeholder = '#mot1 #mot2 #mot3';
    input.className = 'keywords-input';

    copyBtn.addEventListener('click', () => copyText(input.value));

    input.addEventListener('input', () => {
      const keywords = input.value.split(/\s+/).filter(Boolean).map(k => k.replace(/^#+/, ''));
      onChange(keywords);
    });

    header.appendChild(copyBtn);
    content.appendChild(input);
    return card;
  }

  function createQuestionsEditor(items, onChange) {
    const { card, content } = createCard('Questions répondues');

    const header = card.querySelector('.section-title');
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn-small keywords-copy-btn';
    copyBtn.textContent = '📋';
    copyBtn.title = 'Copier les questions';

    const textarea = document.createElement('textarea');
    textarea.value = items.join('\n');
    textarea.placeholder = 'Une question par ligne';
    textarea.className = 'questions-input';

    copyBtn.addEventListener('click', () => copyText(textarea.value));

    textarea.addEventListener('input', () => {
      const questions = textarea.value.split('\n').filter(Boolean);
      onChange(questions);
    });

    header.appendChild(copyBtn);
    content.appendChild(textarea);
    return card;
  }

  function createListEditor({ title, items, itemLabel, singleLine, onChange }) {
    const { card, content } = createCard(title);
    const list = document.createElement('div');
    list.className = 'list-editor';

    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'list-item';

      const badge = document.createElement('span');
      badge.className = 'list-index';
      badge.textContent = index + 1;

      const control = document.createElement('div');
      control.className = 'field-control';
      const input = singleLine ? document.createElement('input') : document.createElement('textarea');
      if (singleLine) input.type = 'text';
      input.value = item;
      input.setAttribute('aria-label', `${itemLabel} ${index + 1}`);
      input.addEventListener('input', () => {
        items[index] = input.value;
        onChange(items);
      });
      control.appendChild(input);

      const actions = document.createElement('div');
      actions.className = 'field-actions';
      actions.append(
        makeButton('Copier', () => copyText(input.value)),
        makeButton('Coller', async () => {
          const pasted = await readClipboardText();
          if (pasted !== null) {
            input.value = pasted;
            items[index] = pasted;
            onChange(items);
          }
        }),
        makeButton('Supprimer', () => {
          items.splice(index, 1);
          onChange(items);
          renderEditor();
        }, 'btn-danger')
      );

      row.append(badge, control, actions);
      list.appendChild(row);
    });

    const addButton = makeButton(`+ Ajouter ${itemLabel.toLowerCase()}`, () => {
      items.push('');
      onChange(items);
      renderEditor();
    });

    content.append(list, addButton);
    return card;
  }

  function makeButton(label, handler, extraClass = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn btn-small ${extraClass}`.trim();
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
  }

  function updateVideoField(fieldName, value, refreshNavigation = false) {
    const video = currentVideo();
    if (!video) return;

    video[fieldName] = value;
    updateDirtyState();

    if (refreshNavigation) {
      renderVideoList();
    }
  }

  function updateDirtyState() {
    state.dirty = stringifyData(state.data) !== state.initialJson;

    if (state.saving) return;

    if (state.dirty) {
      setStatus('Modifications non sauvegardées', 'dirty');
      el.saveBtn.disabled = false;
    } else {
      setStatus('Tout est sauvegardé', 'saved');
      el.saveBtn.disabled = true;
    }
  }

  async function saveData() {
    state.saving = true;
    el.saveBtn.disabled = true;
    setStatus('Enregistrement…', 'loading');

    try {
      const response = await fetch('save.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: stringifyData(state.data),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Erreur HTTP ${response.status}`);
      }

      state.initialJson = stringifyData(state.data);
      state.saving = false;
      updateDirtyState();
      setStatus(`Sauvegardé à ${new Date().toLocaleTimeString('fr-FR')}`, 'saved');
      showToast('Fichier JSON sauvegardé.');
    } catch (error) {
      state.saving = false;
      el.saveBtn.disabled = false;
      setStatus(error.message, 'error');
      showToast(error.message);
    }
  }

  function reloadData() {
    if (state.dirty && !confirm('Des modifications ne sont pas sauvegardées. Recharger quand même ?')) {
      return;
    }
    loadData();
  }

  function addVideo() {
    const serie = currentSerie();
    if (!serie) return;

    serie.videos.push(createEmptyVideo());
    state.selectedVideoIndex = serie.videos.length - 1;
    updateDirtyState();
    render();
  }

  function duplicateVideo() {
    const serie = currentSerie();
    const video = currentVideo();
    if (!serie || !video) return;

    const copy = structuredCloneSafe(video);
    copy.titre = `${copy.titre || 'Vidéo'} - copie`;
    serie.videos.splice(state.selectedVideoIndex + 1, 0, copy);
    state.selectedVideoIndex += 1;
    updateDirtyState();
    render();
  }

  function deleteVideo() {
    const serie = currentSerie();
    const video = currentVideo();
    if (!serie || !video) return;
    if (!confirm(`Supprimer la vidéo « ${video.titre || 'sans titre'} » ?`)) return;

    serie.videos.splice(state.selectedVideoIndex, 1);
    state.selectedVideoIndex = Math.max(0, state.selectedVideoIndex - 1);
    updateDirtyState();
    render();
  }

  function createEmptyVideo() {
    return {
      id_youtube: '',
      titre: 'Nouvelle vidéo',
      'description-courte': '',
      'description-moyenne': '',
      'mots-cles': [],
      'questions-repondues': [],
    };
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text ?? '');
      showToast('Copié dans le presse-papiers.');
    } catch (error) {
      fallbackCopyText(text ?? '');
    }
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Copié dans le presse-papiers.');
    } catch (error) {
      showToast('Copie impossible automatiquement. Sélectionne le texte manuellement.');
    } finally {
      textarea.remove();
    }
  }

  async function readClipboardText() {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      const value = prompt('Collage automatique impossible. Colle le texte ici :');
      return value;
    }
  }

  function downloadJson() {
    const blob = new Blob([stringifyData(state.data)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = DATA_FILE;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function setStatus(message, type) {
    el.saveStatus.textContent = message;
    el.saveStatus.className = `status status-${type}`;
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => {
      el.toast.hidden = true;
    }, 3000);
  }

  function stringifyData(data) {
    return JSON.stringify(data, null, 2);
  }

  function structuredCloneSafe(value) {
    if (window.structuredClone) return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }
})();
