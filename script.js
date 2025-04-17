document.addEventListener("DOMContentLoaded", () => {
  // Load any posts we've created before (or start fresh)
  let createdPosts = JSON.parse(localStorage.getItem("createdPosts") || "[]");

  // Figure out what ID to give the next new post (start at 100 if nothing saved)
  let fakeIdCounter = parseInt(localStorage.getItem("fakeIdCounter"), 10);
  if (isNaN(fakeIdCounter)) {
    fakeIdCounter = 100;
  }

  // Get all of our form fields and message areas
  const putIdInput     = document.getElementById("putId");
  const putTitleInput  = document.getElementById("putTitle");
  const putBodyInput   = document.getElementById("putBody");
  const deleteIdInput  = document.getElementById("deleteId");
  const postMessage    = document.getElementById("postMessage");
  const putMessage     = document.getElementById("putMessage");
  const deleteMessage  = document.getElementById("deleteMessage");
  const resetBtn       = document.getElementById("resetCounter");
  const resetMessage   = document.getElementById("resetMessage");

  // This is where we'll show fetch/XHR results and our live posts
  const getOutput      = document.getElementById("getOutput");
  const postsContainer = document.getElementById("elementOutput");

  // Handy helpers for the fetch/XHR section
  const showGetHtml = html => { getOutput.innerHTML = html; };
  const showGetText = txt  => { getOutput.textContent = txt;  };

  // Keep the PUT and DELETE ID inputs in sync with our current max ID
  function updateIdFields() {
    [putIdInput, deleteIdInput].forEach(input => {
      input.max = fakeIdCounter;
      input.placeholder = `1–${fakeIdCounter} only`;
    });
  }
  updateIdFields();

  // Start with all fields blank on page load
  putIdInput.value    = "";
  putTitleInput.value = "";
  putBodyInput.value  = "";
  deleteIdInput.value = "";

  // Show any posts we already have saved
  function renderPosts() {
    postsContainer.innerHTML = createdPosts
      .map(post => `
        <div class="live-post" data-id="${post.id}">
          <h4>${post.title}</h4>
          <p>${post.body}</p>
        </div><br><br>
      `).join("");
  }
  renderPosts();

  // When you type an ID into the PUT field, autofill the title/body if we have that post
  putIdInput.addEventListener("input", () => {
    const id = +putIdInput.value;
    const match = createdPosts.find(p => p.id === id);
    if (match) {
      putTitleInput.value = match.title;
      putBodyInput.value  = match.body;
    } else {
      putTitleInput.value = "";
      putBodyInput.value  = "";
    }
  });

  // Reset everything back to square one
  resetBtn.addEventListener("click", () => {
    // Clear our saved data
    localStorage.removeItem("fakeIdCounter");
    localStorage.removeItem("createdPosts");
    createdPosts = [];
    fakeIdCounter = 100;
    updateIdFields();

    // Clear out the UI
    postsContainer.innerHTML = "";
    getOutput.innerHTML      = "";
    putIdInput.value         = "";
    putTitleInput.value      = "";
    putBodyInput.value       = "";
    deleteIdInput.value      = "";
    postMessage.textContent  = "";
    putMessage.textContent   = "";
    deleteMessage.textContent= "";

    // Let the user know it’s done
    resetMessage.textContent = "🔄 Counter reset to 100; all posts cleared.";
    resetMessage.className   = "form-message success-message";
  });

  // Header typing effect and dark-mode toggle
  new Typed("header p", {
    strings: ["Interact with JSONPlaceholder via fetch(), XHR, POST, PUT & DELETE"],
    typeSpeed: 80,
    backSpeed: 50,
    backDelay: 2000,
    startDelay: 500,
    loop: false,
  });
  const themeToggle = document.getElementById("themeToggle"),
        body        = document.body,
        icon        = document.getElementById("theme-icon");
  themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    icon.classList.toggle("fa-toggle-on");
    icon.classList.toggle("fa-toggle-off");
  });

  // ------ Task 1: GET with fetch() ------
  document.getElementById("btnFetch").addEventListener("click", () => {
    showGetText("Loading…");
    fetch("https://jsonplaceholder.typicode.com/posts/1")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(post => showGetHtml(`<h4>${post.title}</h4><p>${post.body}</p>`))
      .catch(err => showGetText(`Fetch error: ${err}`));
  });

  // ------ Task 2: GET with XHR ------
  document.getElementById("btnXHR").addEventListener("click", () => {
    showGetText("Loading…");
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "https://jsonplaceholder.typicode.com/posts/2");
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const post = JSON.parse(xhr.responseText);
        showGetHtml(`<h4>${post.title}</h4><p>${post.body}</p>`);
      } else {
        showGetText(`XHR error: ${xhr.status}`);
      }
    };
    xhr.onerror = () => showGetText("Network error (XHR)");
    xhr.send();
  });

  // ------ Task 3: POST via fetch() ------
  document.getElementById("postForm").addEventListener("submit", e => {
    e.preventDefault();
    postMessage.textContent = "";
    postMessage.className   = "form-message";

    const title   = document.getElementById("postTitle").value.trim();
    const bodyTxt = document.getElementById("postBody").value.trim();

    if (!title || !bodyTxt) {
      postMessage.textContent = "⚠️ Both Title and Body are required.";
      postMessage.classList.add("error-message");
      return;
    }

    postMessage.textContent = "📡 Sending POST…";
    fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body: bodyTxt })
    })
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => {
        // Give it a “fake” ID and save it ourselves
        fakeIdCounter += 1;
        data.id = fakeIdCounter;
        createdPosts.unshift(data);
        localStorage.setItem("fakeIdCounter", fakeIdCounter);
        localStorage.setItem("createdPosts", JSON.stringify(createdPosts));

        // Let the user know it worked, then re‑render
        postMessage.innerHTML = `
          <p>✅ Post created (ID: ${data.id})</p>
          <div class="live-post" data-id="${data.id}">
            <h4>${data.title}</h4><p>${data.body}</p>
          </div><br><br>
        `;
        postMessage.classList.add("success-message");

        renderPosts();
        updateIdFields();
        postForm.reset();
      })
      .catch(err => {
        postMessage.textContent = `❌ Failed to create post: ${err}`;
        postMessage.classList.add("error-message");
      });
  });

  // ------ Task 4: PUT via XHR or simulated ------
  document.getElementById("putForm").addEventListener("submit", e => {
    e.preventDefault();
    putMessage.textContent = "";
    putMessage.className   = "form-message";

    const id      = +putIdInput.value;
    const title   = putTitleInput.value.trim();
    const bodyTxt = putBodyInput.value.trim();

    if (!title || !bodyTxt) {
      putMessage.textContent = "⚠️ Title and Body are required.";
      putMessage.classList.add("error-message");
      return;
    }
    if (id < 1 || id > fakeIdCounter) {
      putMessage.textContent = `Please enter an ID between 1 and ${fakeIdCounter}.`;
      putMessage.classList.add("error-message");
      return;
    }

    // If it’s one of our “fake” posts, just update locally
    if (id > 100) {
      const idx = createdPosts.findIndex(p => p.id === id);
      if (idx !== -1) {
        createdPosts[idx].title = title;
        createdPosts[idx].body  = bodyTxt;
        localStorage.setItem("createdPosts", JSON.stringify(createdPosts));
        renderPosts();
        putMessage.textContent = `✅ Post ${id} updated (simulated).`;
        putMessage.classList.add("success-message");
      } else {
        putMessage.textContent = `❌ No local post found with ID ${id}.`;
        putMessage.classList.add("error-message");
      }
      return;
    }

    // Otherwise, send a real PUT request
    putMessage.textContent = "🔄 Updating…";
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `https://jsonplaceholder.typicode.com/posts/${id}`);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const updated = JSON.parse(xhr.responseText);
        const idx = createdPosts.findIndex(p => p.id === id);
        if (idx !== -1) {
          createdPosts[idx] = updated;
        } else {
          createdPosts.unshift(updated);
        }
        localStorage.setItem("createdPosts", JSON.stringify(createdPosts));
        renderPosts();
        putMessage.textContent = `✅ Post ${id} updated.`;
        putMessage.classList.add("success-message");
      } else {
        putMessage.textContent = `PUT error: ${xhr.status}`;
        putMessage.classList.add("error-message");
      }
    };
    xhr.onerror = () => {
      putMessage.textContent = "Network error (PUT)";
      putMessage.classList.add("error-message");
    };
    xhr.send(JSON.stringify({ title, body: bodyTxt }));
  });

  // ------ Task 5: DELETE (simulated or real) ------
  document.getElementById("deleteForm").addEventListener("submit", e => {
    e.preventDefault();
    deleteMessage.textContent = "";
    deleteMessage.className   = "form-message";

    const id = +deleteIdInput.value;
    if (id < 1 || id > fakeIdCounter) {
      deleteMessage.textContent = `⚠️ Please enter an ID between 1 and ${fakeIdCounter}.`;
      deleteMessage.classList.add("error-message");
      return;
    }

    // If it’s one of our “fake” posts, remove locally
    if (id > 100) {
      createdPosts = createdPosts.filter(p => p.id !== id);
      localStorage.setItem("createdPosts", JSON.stringify(createdPosts));
      renderPosts();
      deleteMessage.textContent = `✅ Post ${id} deleted (simulated).`;
      deleteMessage.classList.add("success-message");
      deleteForm.reset();
      return;
    }

    // Otherwise send a real DELETE request
    deleteMessage.textContent = "🗑️ Deleting…";
    fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, { method: "DELETE" })
      .then(r => {
        if (r.ok) {
          createdPosts = createdPosts.filter(p => p.id !== id);
          localStorage.setItem("createdPosts", JSON.stringify(createdPosts));
          renderPosts();
          deleteMessage.textContent = `✅ Post ${id} deleted.`;
          deleteMessage.classList.add("success-message");
          deleteForm.reset();
        } else {
          throw r.status;
        }
      })
      .catch(err => {
        deleteMessage.textContent = `❌ DELETE error: ${err}`;
        deleteMessage.classList.add("error-message");
      });
  });

  // Allow Ctrl+Alt+R to trigger the reset button
  document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "r") {
      resetBtn.click();
    }
  });
});
