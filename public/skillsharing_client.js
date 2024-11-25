function handleAction(state, action) {
  if (action.type == "setUser") {
    localStorage.setItem("userName", action.user);
    return Object.assign({}, state, {user: action.user});
  } else if (action.type == "setTalks") {
    return Object.assign({}, state, {talks: action.talks});
  } else if (action.type == "newTalk") {
    fetchOK(talkURL(action.title), {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        presenter: state.user,
        summary: action.summary
      })
    }).catch(reportError);
  } else if (action.type == "deleteTalk") {
    fetchOK(talkURL(action.talk), {method: "DELETE"})
      .catch(reportError);
  } else if (action.type == "newComment") {
    fetchOK(talkURL(action.talk) + "/comments", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        author: state.user,
        message: action.message
      })
    }).catch(reportError);
  }
  return state;
}

function fetchOK(url, options) {
  return fetch(url, options).then(response => {
    if (response.status < 400) return response;
    else throw new Error(response.statusText);
  });
}

function talkURL(title) {
  return "talks/" + encodeURIComponent(title);
}

function reportError(error) {
  alert(String(error));
}

// function renderUserField(name, dispatch) {
//   return elt("label", {}, "Your name: ", elt("input", {
//     type: "text",
//     value: name,
//     onchange(event) {
//       dispatch({type: "setUser", user: event.target.value});
//     }
//   }));
// }

function elt(type, props, ...children) {
  let dom = document.createElement(type);
  if (props) Object.assign(dom, props);
  for (let child of children) {
    if (typeof child != "string") dom.appendChild(child);
    else dom.appendChild(document.createTextNode(child));
  }
  return dom;
}

// // Функция для обновления поля комментария без потери содержимого и фокуса
// function updateCommentsUI(talkElement, comments) {
//   // Найти поле для ввода нового комментария
//   const commentInput = talkElement.querySelector(".new-comment");
  
//   // Сохранить текущий текст и фокус
//   const previousText = commentInput ? commentInput.value : "";
//   const hasFocus = document.activeElement === commentInput;
  
//   // Перерисовать комментарии
//   renderComments(talkElement, comments);
  
//   // Восстановить текст и фокус
//   const newCommentInput = talkElement.querySelector(".new-comment");
//   if (newCommentInput) {
//     newCommentInput.value = previousText; // Восстановить текст
//     if (hasFocus) newCommentInput.focus(); // Восстановить фокус
//   }
// }

// // Функция для рендеринга комментариев
// function renderComments(talkElement, comments) {
//   const commentsContainer = talkElement.querySelector(".comments");
//   commentsContainer.innerHTML = ""; // Очистить старые комментарии
//   comments.forEach(comment => {
//     const commentNode = document.createElement("div");
//     commentNode.textContent = `${comment.author}: ${comment.message}`;
//     commentsContainer.appendChild(commentNode);
//   });
// }

// // Изменение функции renderTalk для использования updateCommentsUI
// function renderTalk(talk, dispatch) {
//   let talkElement = elt(
//     "section", {className: "talk"},
//     elt("h2", null, talk.title, " ", elt("button", {
//       type: "button",
//       onclick() {
//         dispatch({type: "deleteTalk", talk: talk.title});
//       }
//     }, "Delete")),
//     elt("div", null, "by ", elt("strong", null, talk.presenter)),
//     elt("p", null, talk.summary),
//     elt("div", {className: "comments"}, ...talk.comments.map(renderComment)),
//     elt("form", {
//       onsubmit(event) {
//         event.preventDefault();
//         let form = event.target;
//         dispatch({type: "newComment", talk: talk.title, message: form.elements.comment.value});
//         form.reset();
//       }
//     }, elt("input", {type: "text", name: "comment", className: "new-comment"}), " ",
//        elt("button", {type: "submit"}, "Add comment"))
//   );

//   // Обновление комментариев при каждом вызове функции
//   updateCommentsUI(talkElement, talk.comments);

//   return talkElement;
// }

// function renderComment(comment) {
//   return elt("p", {className: "comment"},
//              elt("strong", null, comment.author),
//              ": ", comment.message);
// }


/** Новая функция для работы с шаблонами */
function instantiateTemplate(template, values) {
  let copy = template.content.cloneNode(true);

  // Поддержка template-repeat
  for (let node of copy.querySelectorAll("[template-repeat]")) {
    let parent = node.parentNode;
    let array = values[node.getAttribute("template-repeat")];
    if (!Array.isArray(array)) continue;

    for (let item of array) {
      let clone = node.cloneNode(true);
      instantiateTemplate(clone, item);
      parent.insertBefore(clone, node);
    }
    parent.removeChild(node); // Удаляем оригинальный узел
  }

  // Поддержка template-if
  for (let node of copy.querySelectorAll("[template-if]")) {
    let condition = node.getAttribute("template-if");
    if (!values[condition]) {
      node.remove(); // Удаляем узел, если условие ложно
    }
  }

  // Заполнение текста ({{ключ}})
  for (let node of copy.querySelectorAll("[template-text]")) {
    let key = node.getAttribute("template-text");
    if (key in values) {
      node.textContent = values[key];
    }
  }

  return copy;
}

/** Изменённая функция drawTalk с использованием шаблонов */
function drawTalk(talk, dispatch) {
  let template = document.querySelector("#talk-template");
  let element = instantiateTemplate(template, talk);

  // Удаление темы
  element.querySelector(".delete").addEventListener("click", () => {
    dispatch({ type: "deleteTalk", talk: talk.title });
  });

  // Добавление комментария
  element.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    let form = event.target;
    dispatch({
      type: "newComment",
      talk: talk.title,
      message: form.elements.comment.value,
    });
    form.reset();
  });

  return element;
}




function renderTalkForm(dispatch) {
  let title = elt("input", {type: "text"});
  let summary = elt("input", {type: "text"});
  return elt("form", {
    onsubmit(event) {
      event.preventDefault();
      dispatch({type: "newTalk",
                title: title.value,
                summary: summary.value});
      event.target.reset();
    }
  }, elt("h3", null, "Submit a Talk"),
     elt("label", null, "Title: ", title),
     elt("label", null, "Summary: ", summary),
     elt("button", {type: "submit"}, "Submit"));
}

async function pollTalks(update) {
  let tag = undefined;
  for (;;) {
    let response;
    try {
      response = await fetchOK("/talks", {
        headers: tag && {"If-None-Match": tag,
                         "Prefer": "wait=90"}
      });
    } catch (e) {
      console.log("Request failed: " + e);
      await new Promise(resolve => setTimeout(resolve, 500));
      continue;
    }
    if (response.status == 304) continue;
    tag = response.headers.get("ETag");
    update(await response.json());
  }
}

var SkillShareApp = class SkillShareApp {
  constructor(state, dispatch) {
    this.dispatch = dispatch;
    this.talkDOM = elt("div", {className: "talks"});
    this.dom = elt("div", null,
                   renderUserField(state.user, dispatch),
                   this.talkDOM,
                   renderTalkForm(dispatch));
    this.syncState(state);
  }

  syncState(state) {
    if (state.talks != this.talks) {
      this.talkDOM.textContent = "";
      for (let talk of state.talks) {
        this.talkDOM.appendChild(
          renderTalk(talk, this.dispatch));
      }
      this.talks = state.talks;
    }
  }
}

function runApp() {
  let user = localStorage.getItem("userName") || "Anon";
  let state, app;
  function dispatch(action) {
    state = handleAction(state, action);
    app.syncState(state);
  }

  pollTalks(talks => {
    if (!app) {
      state = {user, talks};
      app = new SkillShareApp(state, dispatch);
      document.body.appendChild(app.dom);
    } else {
      dispatch({type: "setTalks", talks});
    }
  }).catch(reportError);
}

runApp();
