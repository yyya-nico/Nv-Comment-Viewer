import {htmlspecialchars} from './utils';

document.addEventListener('DOMContentLoaded', () => {
  const listArea = document.querySelector('.list-area');
  const commentsLoadForm = document.forms['comments-load'];
  commentsLoadForm.videoId = commentsLoadForm.elements['video-id'];
  commentsLoadForm.submitButton = commentsLoadForm.elements['submit-button'];
  const introDetails = document.querySelector('details');
  const threadSel = document.getElementById('thread');
  const commentsList = document.getElementById('comments-list');
  const commentsSyncBtn = document.getElementById('comments-sync');
  const detailPc = document.querySelector('.detail-pc');
  const defaultTitle = document.title;
  const cutIndex = location.pathname.lastIndexOf('/') + 1;
  const defaultPath = location.pathname.slice(0 , cutIndex);
  const videoIdCandidate = location.pathname.slice(cutIndex);
  const isSmallWindow = () => window.innerWidth < 1024;
  let nicoApiData = null;
  let commentData = null;
  let timeIndex = [];
  let autoScroll = true;
  let scrollPosition = 0;

  //---------------
  // Form Controls
  //---------------

  const buttonJudgement = () => commentsLoadForm.submitButton.disabled = !commentsLoadForm.checkValidity();

  commentsLoadForm.addEventListener('input', buttonJudgement);
  
  const makeHTMLFromComment = comment => {
    const formatted = {
      text: htmlspecialchars(comment.body).replace(/\n/g, '<br>'),
      nicoru: comment.nicoruCount !== 0 ? comment.nicoruCount : '',
      time: ((baseDate) => {
        /* if (baseDate.getUTCFullYear() - 1970) {
          baseDate.setUTCFullYear(baseDate.getUTCFullYear() - 1970);
          value = baseDate.toLocaleString([], {timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 2});
        } else if (baseDate.getUTCMonth()) {
          baseDate.setUTCMonth(baseDate.getUTCMonth() - 1);
          value = baseDate.toLocaleString([], {timeZone: 'UTC', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 2});
        } else */ if (baseDate.getUTCDate() - 1) {
          baseDate.setUTCMonth(baseDate.getUTCDate() - 2);
          return baseDate.toLocaleString([], {timeZone: 'UTC', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 2});
        } else {
          return baseDate.toLocaleString([], {timeZone: 'UTC', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 2});
        }
      })(new Date(Number(comment.vposMs)))
    };
    const html = 
    `<li data-id="${comment.id}" data-user-id="${comment.userId}">
      <span class="text">${formatted.text}</span><span class="nicoru">${formatted.nicoru}</span><span class="time">${formatted.time}</span>
      <script type="application/json" class="raw-data">${JSON.stringify(comment)}</script>
    </li>
    `;
    return html;
  };

  const appendComments = comments => {
    let html = '';
    timeIndex = [];
    comments.forEach(comment => {
      html += makeHTMLFromComment(comment);
      timeIndex.push(comment.vposMs);
    });
    commentsList.insertAdjacentHTML('beforeend', html);
    // console.log('comment count:', commentsList.querySelectorAll('li').length);
  }

  let newThreadKey = null;
  commentsLoadForm.addEventListener('submit', async e => {
    e.preventDefault();
    let inputedStr = commentsLoadForm.videoId.value;
    const cutStart = inputedStr.lastIndexOf('/') + 1;
    const cutEnd = inputedStr.includes('?') ? inputedStr.indexOf('?') : undefined;
    const videoId = inputedStr.slice(cutStart, cutEnd);
    commentsLoadForm.videoId.value = videoId;
    commentsLoadForm.submitButton.disabled = true;
    commentsLoadForm.submitButton.textContent = '読み込み中...';
    commentsList.textContent = '';
    if (nicoApiData) {
      const nvComment = nicoApiData.comment.nvComment;
      await fetch(`${nvComment.server}/v1/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Frontend-Id': '6',
          'X-Frontend-Version': '0',
        },
        body: JSON.stringify({
          params: nvComment.params,
          threadKey: newThreadKey || nvComment.threadKey,
          additionals: {},
        }),
      }).then(async response => {
        // console.log(response);
        if (response.status !== 200) {
          console.log('error or no content', response.status);
        }
        commentData = await response.json();
        // console.log(commentData);
        if (commentData.meta.errorCode === 'EXPIRED_TOKEN') {
          console.error('Error:', commentData.meta.errorCode);
          alert('エラー:' + commentData.meta.errorCode);
          // await fetch(`https://nvapi.nicovideo.jp/v1/comment/keys/thread?videoId=${videoId}`, {
          //     headers: {
          //       'X-Frontend-Id': '6',
          //       'X-Frontend-Version': '0',
          //       'Content-Type': 'application/json',
          //     }
          //   }
          // )
          //   .then(response => response.json())
          //   .then(json => {
          //     newThreadKey = json.data.threadKey;
          //     console.log(newThreadKey);
          //     commentsLoadForm.submit();
          // });
        } else if (commentData.meta.errorCode) {
          console.error('Error:', commentData.meta.errorCode);
          alert('エラー:' + commentData.meta.errorCode);
        } else if (!commentData.data.globalComments[0].count) {
          console.log('not comments found');
          alert('コメントがありませんでした。');
        } else {
          const thread = commentData.data.threads.find(thread => {
            switch (threadSel.value) {
              case 'default':
                return thread.fork === 'main';
              default:
                return thread.fork === threadSel.value;
            }
          });
          thread.comments.sort((a, b) => a.vposMs - b.vposMs);
          appendComments(thread.comments);
        }
      }).catch(e => {
        console.error('Failed to load', e);
      });
      document.title = `${nicoApiData.video.title} - ${defaultTitle}`;
    } else {
      alert('開発中');
      document.title = `${videoId} - ${defaultTitle}`;
    }
    history.pushState(null, '', `${defaultPath}${videoId}`);
    commentsLoadForm.submitButton.disabled = false;
    commentsLoadForm.submitButton.textContent = '取得';
  }, {passive: false});

  //----------------
  // /Form Controls
  //----------------

  threadSel.addEventListener('change', () => {
    commentsList.textContent = '';
    const thread = commentData.data.threads.find(thread => {
      switch (threadSel.value) {
        case 'default':
          return thread.fork === 'main';
        default:
          return thread.fork === threadSel.value;
      }
    });
    thread.comments.sort((a, b) => a.vposMs - b.vposMs);
    appendComments(thread.comments);
  });

  if (/(^sm|^nm|^so)[0-9]+/.test(videoIdCandidate)) {
    introDetails.open = false;
    const videoId = videoIdCandidate;
    commentsLoadForm.videoId.value = videoId;
    commentsLoadForm.requestSubmit();
  }

  window.addEventListener('message', e => {
    if (e.origin === 'https://www.nicovideo.jp') {
      switch (e.data.eventName) {
          case 'sendData':
            introDetails.open = false;
            nicoApiData = e.data.data;
            const videoId = nicoApiData.client.watchId;
            commentsLoadForm.videoId.value = videoId;
            commentsLoadForm.requestSubmit();
            // console.log(e.data);
            break;

          case 'playerMetadataChange':
            const currentTime = e.data.data.currentTime;
            if (autoScroll) {
              const nextItemIndex = timeIndex.findIndex(val => val > currentTime);
              // console.log(nextItemIndex);
              const scrollTarget = commentsList.children[nextItemIndex];
              scrollPosition = scrollTarget.offsetTop - listArea.clientHeight + scrollTarget.offsetHeight + 2;
              listArea.scrollTo({top: scrollPosition, behavior: 'instant'});
            }
            // console.log(currentTime);
            break;

          default:
            console.log(e.data);
            break;
      }
    }
  });

  window.opener?.postMessage({
    eventName: 'ready',
  }, 'https://www.nicovideo.jp');

  document.addEventListener('visibilitychange', () => {
    switch (document.visibilityState) {
      case 'hidden':
        window.opener?.postMessage({
          eventName: 'bye',
        }, 'https://www.nicovideo.jp');
        break;

      case 'visible':
        window.opener?.postMessage({
          eventName: 'returned',
        }, 'https://www.nicovideo.jp');        
        break;
    }
  });

  commentsList.addEventListener('click', e => {
    const li = e.target.closest('li');
    const detailSp = document.querySelector('.detail-sp');
    const oldSameUsers = document.getElementsByClassName('same-user');
    if (!li || li.classList.contains('detail-sp')) {
      return;
    }
    [...oldSameUsers].forEach(elem => elem.classList.remove('same-user'));
    if (li.nextElementSibling && li.nextElementSibling.classList.contains('detail-sp')) {
      detailPc.textContent = '';
      detailSp.remove();
      return;
    }
    if (detailPc.textContent !== '') {
      detailPc.textContent = '';
    }
    if (detailSp) {
      detailSp.remove();
    }
    autoScroll = false;
    commentsSyncBtn.hidden = false;
    const scrollPosition = isSmallWindow() ? li.offsetTop - 2 : li.offsetTop - (listArea.clientHeight - li.offsetHeight) / 2;
    listArea.scrollTo({top: scrollPosition});
    const rawMeta = JSON.parse((li.querySelector('.raw-data').textContent));
    const dl = document.createElement('dl');
    const descList = {
      id: 'コメントID',
      no: 'コメント番号',
      vposMs: '再生時間',
      body: 'コメント',
      commands: 'コマンド',
      userId: 'ユーザーID',
      isPremium: 'プレミアム会員',
      score: 'NGスコア',
      postedAt: '日時',
      nicoruCount: 'ニコられた数',
      source: 'ソース',
      isMyPost: '自分の投稿'
    };
    let html = '';
    Object.keys(rawMeta).forEach(key => {
      let value = rawMeta[key];
      switch (key) {
        case 'vposMs':
          const baseDate = new Date(Number(value));
          /* if (baseDate.getUTCFullYear() - 1970) {
            baseDate.setUTCFullYear(baseDate.getUTCFullYear() - 1970);
            value = baseDate.toLocaleString([], {timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 2});
          } else if (baseDate.getUTCMonth()) {
            baseDate.setUTCMonth(baseDate.getUTCMonth() - 1);
            value = baseDate.toLocaleString([], {timeZone: 'UTC', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 2});
          } else */ if (baseDate.getUTCDate() - 1) {
            baseDate.setUTCMonth(baseDate.getUTCDate() - 2);
            value = baseDate.toLocaleString([], {timeZone: 'UTC', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 2});
          } else {
            value = baseDate.toLocaleString([], {timeZone: 'UTC', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 2});
          }
          break;
        case 'commands':
          value = value.join(' ');
          break;
        case 'postedAt':
          value = new Date(value)
            .toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'});
          break;
        case 'userId':
          !rawMeta.commands.includes('184') && (value = `<a href="https://nico.ms/user/${rawMeta.userId}" target="_blank">${value}</a>`);
          break;
        case 'isPremium':
        case 'isMyPost':
          value = value ? 'はい' : 'いいえ';
          break;
      }
      html +=
      `<dt>${descList[key] || key}</dt>
      <dd>${value}</dd>
      `;
    });
    dl.innerHTML = html;
    const commentItems = commentsList.children;
    const newSameUsers = [...commentItems].filter(comment => comment.dataset.userId === rawMeta.userId);
    const numberOfCommentsFromSameUser = newSameUsers.findIndex(comment => comment.dataset.id === rawMeta.id) + 1;
    const dl2 =
    `<dl>
      <dt>コメント回数</dt>
      <dd>${numberOfCommentsFromSameUser}回目/全${newSameUsers.length}回中</dd>
    </dl>
    `;
    detailPc.appendChild(dl.cloneNode(true));
    detailPc.appendChild(document.createElement('hr'));
    detailPc.insertAdjacentHTML('beforeend', dl2);
    const newDetailSp = document.createElement('li');
    newDetailSp.classList.add('detail-sp');
    newDetailSp.appendChild(dl);
    newDetailSp.appendChild(document.createElement('hr'));
    newDetailSp.insertAdjacentHTML('beforeend', dl2);
    li.insertAdjacentElement('afterend', newDetailSp);
    newSameUsers.forEach(comment => comment.classList.add('same-user'));
  });

  commentsSyncBtn.addEventListener('click', () => {
    autoScroll = true;
    commentsSyncBtn.hidden = true;
    document.querySelector('.detail-sp')?.previousElementSibling.click();
  });

  listArea.addEventListener('scroll', e => {
    if (Math.abs(scrollPosition - listArea.scrollTop) >= 3) {
      autoScroll = false;
      commentsSyncBtn.hidden = false;
      console.log(false);
    } else {
      autoScroll = true;
      commentsSyncBtn.hidden = true;
      console.log(true);
    }
  });
});