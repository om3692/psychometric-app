document.addEventListener('DOMContentLoaded', () => {
  const attemptId = document.getElementById('attemptId').value;
  const questionArea = document.getElementById('question-area');
  const prevBtn = document.getElementById('prev-button');
  const nextBtn = document.getElementById('next-button');
  const submitBtn = document.getElementById('submit-button');
  const progressText = document.getElementById('progress-text');
  const progressBar = document.getElementById('progress-bar');

  let current = 0;
  let responses = [];
  const timeSpent = Array(questionsData.length).fill(0);
  const timeTrack = Array(questionsData.length).fill(Date.now());

  function renderQuestion(index) {
    const q = questionsData[index];
    if (!q) return;

    console.log('[DEBUG] Rendering Question:', q);
    questionArea.innerHTML = '';
    const container = document.createElement('div');
    container.classList.add('question-card');

    const title = document.createElement('p');
    title.innerHTML = `<strong>Q${q.questionnumber}:</strong> ${q.prompt}`;
    container.appendChild(title);

    const options = Array.isArray(q.options) ? q.options : (q.options ? q.options : []);
    const saved = responses[index];

    // Render image if present (for image_based, abstract_stimuli)
    if (q.metadata && q.metadata.imageUrl) {
      const img = document.createElement('img');
      img.src = q.metadata.imageUrl;
      img.className = 'img-fluid mb-3';
      img.alt = 'Question visual';
      container.appendChild(img);
    }

    // Likert, Single Choice, Forced Choice
    if (['likert', 'single_choice', 'forced_choice', 'image_based', 'abstract_stimuli'].includes(q.type)) {
      options.forEach(opt => {
        const label = document.createElement('label');
        label.classList.add('form-check-label');

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `question-${q.questionid}`;
        input.value = opt;
        input.classList.add('form-check-input');
        if (saved && saved.answer === opt) input.checked = true;

        label.appendChild(input);
        label.append(` ${opt}`);

        const div = document.createElement('div');
        div.classList.add('form-check');
        div.appendChild(label);
        container.appendChild(div);
      });

    } else if (q.type === 'multiple_choice') {
      options.forEach(opt => {
        const label = document.createElement('label');
        label.classList.add('form-check-label');

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = `question-${q.questionid}`;
        input.value = opt;
        input.classList.add('form-check-input');

        if (saved && Array.isArray(saved.answer) && saved.answer.includes(opt)) {
          input.checked = true;
        }

        label.appendChild(input);
        label.append(` ${opt}`);

        const div = document.createElement('div');
        div.classList.add('form-check');
        div.appendChild(label);
        container.appendChild(div);
      });

    } else if (q.type === 'ranking') {
      const ol = document.createElement('ol');
      options.forEach(opt => {
        const li = document.createElement('li');
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = opt;
        input.dataset.label = opt;
        input.classList.add('form-control', 'mb-2');

        if (saved && Array.isArray(saved.answer)) {
          const matched = saved.answer.find(a => a[opt]);
          if (matched) input.value = matched[opt];
        }

        li.appendChild(input);
        ol.appendChild(li);
      });
      container.appendChild(ol);
    }

    questionArea.appendChild(container);
    updateNavButtons();
    updateProgress(index);
  }

  function updateNavButtons() {
    prevBtn.disabled = current === 0;
    nextBtn.classList.toggle('d-none', current === questionsData.length - 1);
    submitBtn.classList.toggle('d-none', current !== questionsData.length - 1);
  }

  function updateProgress(index) {
    const pct = Math.floor(((index + 1) / questionsData.length) * 100);
    progressBar.style.width = `${pct}%`;
    progressText.innerText = `Question ${index + 1} / ${questionsData.length}`;
  }

  function saveCurrentAnswer() {
    const q = questionsData[current];
    const inputs = document.querySelectorAll('input[name^="question-"]');
    let answer;

    if (inputs[0]?.type === 'radio') {
      const checked = Array.from(inputs).find(i => i.checked);
      answer = checked ? checked.value : null;
    } else if (inputs[0]?.type === 'checkbox') {
      answer = Array.from(inputs)
        .filter(i => i.checked)
        .map(i => i.value);
    } else {
      answer = Array.from(inputs).map(i => {
        return { [i.dataset.label]: i.value };
      });
    }

    const now = Date.now();
    timeSpent[current] += (now - timeTrack[current]) / 1000;
    timeTrack[current] = now;

    responses[current] = {
      questionId: q.questionid,
      answer,
      timeSpentSeconds: Math.floor(timeSpent[current])
    };
  }

  prevBtn.addEventListener('click', () => {
    saveCurrentAnswer();
    current--;
    renderQuestion(current);
  });

  nextBtn.addEventListener('click', () => {
    saveCurrentAnswer();
    current++;
    renderQuestion(current);
  });

  submitBtn.addEventListener('click', async () => {
    saveCurrentAnswer();

    const duration = Math.floor(
      timeSpent.reduce((acc, sec) => acc + sec, 0)
    );

    const payload = {
      attemptId,
      responses,
      durationSeconds: duration
    };

    document.getElementById('loading-overlay').style.display = 'block';

    try {
      const res = await fetch('/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.redirected) {
        window.location.href = res.url;
      } else {
        const msg = await res.text();
        alert(`Submit failed: ${msg}`);
        document.getElementById('loading-overlay').style.display = 'none';
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to submit test.');
      document.getElementById('loading-overlay').style.display = 'none';
    }
  });

  renderQuestion(current);
});
