import './style.scss'

import {htmlspecialchars, random} from './utils';

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  const commentsLoadForm = document.forms['comments-load'];
  commentsLoadForm.videoId = commentsLoadForm.elements['video-id'];
  commentsLoadForm.submitButton = commentsLoadForm.elements['submit-button'];
  const introDetails = document.querySelector('details');
  const config = document.querySelector('.config');
  const watchLink = document.querySelector('.watch-link a');
  const commentsList = document.getElementById('comments-list');
  const detailPc = document.querySelector('.detail-pc');
  const defaultTitle = document.title;
  const defaultPath = '/nv-comment-viewer';
  const videoIdCandidate = location.pathname.replace(defaultPath, '').slice(1);
  const base = `${location.origin}${defaultPath}/`;
  const isSmallWindow = () => window.innerWidth < 1024;
  let nicoApiData = null;
  let commentsData = null;
  let timeIndex = [];

  //---------------
  // Form Controls
  //---------------

  const buttonJudgement = () => commentsLoadForm.submitButton.disabled = !commentsLoadForm.checkValidity();

  commentsLoadForm.addEventListener('input', buttonJudgement);

  const makeHTMLFromComment = comment => {
    const formatted = {
      text: htmlspecialchars(comment.message).replace(/\n/g, '<br>'),
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
        } else if (baseDate.getUTCHours()) {
          return baseDate.toLocaleString([], {timeZone: 'UTC', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 2});
        } else {
          return baseDate.toLocaleString([], {timeZone: 'UTC', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 2});
        }
      })(new Date(Number(comment.vposMsec)))
    };
    const html =
    `<li data-id="${comment.id}" tabindex="0">
      <span class="text">${formatted.text}</span><span class="time">${formatted.time}</span>
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
      timeIndex.push(comment.vposMsec);
    });
    commentsList.insertAdjacentHTML('beforeend', html);
    // console.log('comment count:', commentsList.querySelectorAll('li').length);
  }

  commentsLoadForm.addEventListener('submit', async e => {
    e.preventDefault();
    commentsLoadForm.submitButton.disabled = true;
    commentsLoadForm.submitButton.textContent = '読み込み中...';
    commentsList.textContent = '';
    let inputedStr = commentsLoadForm.videoId.value;
    const cutStart = inputedStr.lastIndexOf('/') + 1;
    const cutEnd = inputedStr.includes('?') ? inputedStr.indexOf('?') : undefined;
    const videoId = inputedStr.slice(cutStart, cutEnd);
    commentsLoadForm.videoId.value = videoId;
    watchLink.href = `https://www.nicovideo.jp/watch_tmp/${videoId}`;
    if (!nicoApiData || nicoApiData.client.watchId !== videoId) {
      const APIURL = new URL('watch', base)/* new URL(`https://www.nicovideo.jp/api/watch/tmp/${videoId}?_frontendId=6&_frontendVersion=0.0.0`) */;
      const APIParams = APIURL.searchParams;
      APIParams.append('id', videoId);
      await fetch(APIURL)
        .then(async response => {
        // console.log(response);
        if (response.status !== 200) {
          console.log('error or no content', response.status);
        }
        const data = await response.json();
        // console.log(data);
        if (data.meta.status !== 200) {
          console.error('Error:', data.meta.status);
          console.dir(data.meta);
          alert(`エラー:${data.meta.errorCode}`);
        } else {
          nicoApiData = data.data;
        }
      }).catch(e => {
        console.error('Failed to load', e);
      });
    }
    if (nicoApiData?.client.watchId === videoId) {
      const APIURL = new URL('comments', base)/* new URL(`https://nvapi.nicovideo.jp/v1/tmp/comments/${videoId}?_frontendId=6&_frontendVersion=0.0.0`) */;
      const APIParams = APIURL.searchParams;
      APIParams.append('id', videoId);
      await fetch(APIURL)
        .then(async response => {
        // console.log(response);
        if (response.status !== 200) {
          console.log('error or no content', response.status);
        }
        const data = await response.json();
        // console.log(data);
        if (data.meta.status !== 200) {
          console.error('Error:', data.meta.status);
          console.dir(data.meta);
          alert('エラー:' + data.meta.errorCode);
        } else {
          commentsData = data.data;
        }
      }).catch(e => {
        console.error('Failed to load', e);
      });
      if (!commentsData.comments.length) {
        console.log('not comments found');
        alert('コメントがありませんでした。');
      } else {
        config.hidden = false;
        commentsData.comments.sort((a, b) => a.vposMsec - b.vposMsec);
        appendComments(commentsData.comments);
        document.title = `${nicoApiData.video.title} - ${defaultTitle}`;
        history.pushState(null, '', `${defaultPath}/${videoId}`);
      }
    }
    commentsLoadForm.submitButton.disabled = false;
    commentsLoadForm.submitButton.textContent = '取得';
  }, {passive: false});

  //----------------
  // /Form Controls
  //----------------

  if (/(^sm|^nm|^so)[0-9]+/.test(videoIdCandidate)) {
    introDetails.open = false;
    const videoId = videoIdCandidate;
    commentsLoadForm.videoId.value = videoId;
    commentsLoadForm.requestSubmit();
  }

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
    // autoScroll = false;
    // commentsSyncBtn.hidden = false;
    const scrollPosition = isSmallWindow() ? li.offsetTop - 2 - 10 : li.offsetTop - (window.innerHeight - header.offsetHeight - li.offsetHeight) / 2;
    const behavior = e.isTrusted ? 'smooth' : 'instant';
    window.scrollTo({top: scrollPosition, behavior});
    const rawMeta = JSON.parse((li.querySelector('.raw-data').textContent));
    const dl = document.createElement('dl');
    const descList = {
      id: 'コメントID',
      no: 'コメント番号',
      vposMsec: '再生時間',
      message: 'コメント',
      command: 'コマンド',
      userId: 'ユーザーID',
      isPremium: 'プレミアム会員',
      score: 'NGスコア',
      postedAt: '日時',
      nicoruCount: 'ニコられた数',
      source: 'ソース',
      isMyPost: '自分の投稿'
    };
    let html = '';
    Object.entries(rawMeta).forEach(([key, value]) => {
      switch (key) {
        case 'vposMsec':
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
        case 'postedAt':
          value = new Date(value)
            .toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'});
          break;
        case 'command':
          value ||= '(なし)';
          break;
        case 'userId':
          !rawMeta.command.includes('184') && (value = `<a href="https://nico.ms/user/${rawMeta.userId}" target="_blank">${value}</a>`);
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
    const newSameUser = [...commentItems].find(comment => comment.dataset.id === rawMeta.id);
    const dl2 =
    `<dl>
      <dt>コメント数</dt>
      <dd>${commentItems.length}コメ</dd>
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
    newSameUser.classList.add('same-user');
  });

  let focusedLi = null;
  commentsList.addEventListener('focus', e => {
    focusedLi = e.target;
  }, true);
  commentsList.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        (() => {
          const next = focusedLi ? (focusedLi.previousElementSibling ?? commentsList.lastElementChild) : commentsList.firstElementChild;
          next.click();
          next.focus();
        })();
        break;
      case 'ArrowDown':
        e.preventDefault();
        (() => {
          const next = (focusedLi?.nextElementSibling?.classList.contains('detail-sp') ? focusedLi.nextElementSibling?.nextElementSibling : focusedLi?.nextElementSibling) ?? commentsList.firstElementChild;
          next.click();
          next.focus();
        })();
        break;
      case ' ':
      case 'Enter':
        if (e.target === document.activeElement) {
          e.preventDefault();
          e.target.click();
          e.target.focus();
        }
        break;
    }
  });
});