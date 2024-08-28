import './style.scss'

import {htmlspecialchars, random} from './utils';

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  const commentsLoadForm = document.forms['comments-load'];
  commentsLoadForm.videoId = commentsLoadForm.elements['video-id'];
  commentsLoadForm.submitButton = commentsLoadForm.elements['submit-button'];
  const introDetails = document.querySelector('details');
  const config = document.querySelector('.config');
  const threadSel = document.getElementById('thread');
  const watchLink = document.querySelector('.watch-link a');
  const nicoAdWrapper = document.querySelector('.nico-ad');
  const nicoAd = document.getElementById('nico-ad');
  const commentsList = document.getElementById('comments-list');
  const commentsSyncBtn = document.getElementById('comments-sync');
  const detailPc = document.querySelector('.detail-pc');
  const defaultTitle = document.title;
  const defaultPath = '/nv-comment-viewer';
  const videoIdCandidate = location.pathname.replace(defaultPath, '').slice(1);
  const base = `${location.origin}${defaultPath}/`;
  const isSmallWindow = () => window.innerWidth < 1024;
  let nicoApiData = null;
  let commentData = null;
  let audible = false;
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
        } else if (baseDate.getUTCHours()) {
          return baseDate.toLocaleString([], {timeZone: 'UTC', hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 2});
        } else {
          return baseDate.toLocaleString([], {timeZone: 'UTC', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 2});
        }
      })(new Date(Number(comment.vposMs)))
    };
    const html =
    `<li data-id="${comment.id}" data-user-id="${comment.userId}" tabindex="0">
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
    commentsLoadForm.submitButton.disabled = true;
    commentsLoadForm.submitButton.textContent = '読み込み中...';
    commentsList.textContent = '';
    let inputedStr = commentsLoadForm.videoId.value;
    const cutStart = inputedStr.lastIndexOf('/') + 1;
    const cutEnd = inputedStr.includes('?') ? inputedStr.indexOf('?') : undefined;
    const videoId = inputedStr.slice(cutStart, cutEnd);
    commentsLoadForm.videoId.value = videoId;
    watchLink.href = `https://nico.ms/${videoId}`;
    if (nicoApiData?.client.watchId !== videoId) {
      if (audible && e.isTrusted) {
        audible = false;
        nicoAdWrapper.hidden = true;
      }
      const APIURL = new URL('watch_v3_guest', base)/* new URL(`https://www.nicovideo.jp/api/watch/v3_guest/${videoId}`) */;
      const APIParams = APIURL.searchParams;
      APIParams.append('id', videoId);
      const actionTrackId = `${random.string(10)}_${Math.floor(Date.now()/1000)}`;
      APIParams.append('actionTrackId', actionTrackId);
      await fetch(APIURL, {
        method: 'POST',
        // headers: {
        //   'X-Frontend-Id': '6',
        //   'X-Frontend-Version': '0',
        // }
      }).then(async response => {
        // console.log(response);
        if (response.status !== 200) {
          console.log('error or no content', response.status);
        }
        const data = await response.json();
        // console.log(data);
        if (data.meta.errorCode === 'FORBIDDEN') {
          console.error('Error:', data.meta.errorCode, data.data.reasonCode);
          alert(`エラー:${data.meta.errorCode}、理由:${data.data.reasonCode}`);
        } else if (data.meta.errorCode) {
          console.error('Error:', data.meta.errorCode);
          alert('エラー:' + data.meta.errorCode);
        } else {
          nicoApiData = data.data;
          newThreadKey = null;
        }
      }).catch(e => {
        console.error('Failed to load', e);
      });
    }
    if (nicoApiData?.client.watchId === videoId) {
      const nvComment = nicoApiData.comment.nvComment;
      await fetch(`${nvComment.server}/v1/threads`, {
        method: 'POST',
        headers: {
          'X-Client-Os-Type': 'others',
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
          const APIURL = new URL('v1_comment_keys_thread', base)/* new URL(`https://nvapi.nicovideo.jp/v1/comment/keys/thread?videoId=${videoId}`) */;
          const APIParams = APIURL.searchParams;
          APIParams.append('videoId', videoId);
          await fetch(APIURL, {
              // headers: {
              //   'X-Frontend-Id': '6',
              //   'X-Frontend-Version': '0',
              //   'Content-Type': 'application/json',
              // }
            }
          ).then(async response => {
            // console.log(response);
            if (response.status !== 200) {
              console.log('error or no content', response.status);
            }
            return response.json();
          }).then(json => {
              newThreadKey = json.data.threadKey;
              // console.log(newThreadKey);
              commentsLoadForm.requestSubmit();
          }).catch(e => {
            console.error('Failed to load', e);
          });
        } else if (commentData.meta.errorCode) {
          console.error('Error:', commentData.meta.errorCode);
          alert('エラー:' + commentData.meta.errorCode);
        } else if (!commentData.data.globalComments[0].count) {
          console.log('not comments found');
          alert('コメントがありませんでした。');
        } else {
          threadSel.value = 'default';
          config.hidden = false;
          const thread = commentData.data.threads.find(thread => thread.fork === 'main');
          thread.comments.sort((a, b) => a.vposMs - b.vposMs);
          appendComments(thread.comments);
          document.title = `${nicoApiData.video.title} - ${defaultTitle}`;
          history.pushState(null, '', `${defaultPath}/${videoId}`);
        }
      }).catch(e => {
        console.error('Failed to load', e);
      });
    }
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
          case 'sendVideoId':
            audible = true;
            introDetails.open = false;
            nicoAdWrapper.hidden = false;
            let videoId = '';
            if (e.data.eventName === 'sendData') {
              nicoApiData = e.data.data;
              videoId = nicoApiData.client.watchId;
            } else {
              nicoApiData = null;
              videoId = e.data.data.videoId;
            }
            commentsLoadForm.videoId.value = videoId;
            commentsLoadForm.requestSubmit();
            window.addEventListener('scroll', e => {
              if (audible) {
                if (Math.abs(scrollPosition - window.scrollY) >= 3) {
                  autoScroll = false;
                  commentsSyncBtn.hidden = false;
                  // console.log(false);
                } else {
                  autoScroll = true;
                  commentsSyncBtn.hidden = true;
                  // console.log(true);
                }
              } else {
                commentsSyncBtn.hidden = true;
              }
            });
            // console.log(e.data);
            break;

          case 'playerMetadataChange':
            if (autoScroll && !commentsLoadForm.submitButton.disabled) {
              const duration = nicoApiData.video.duration;
              const progressPercentage = e.data.data.progressPercentage;
              const isIncludeNicoAd = nicoAd.checked;
              const currentTime = Math.floor((duration + (isIncludeNicoAd ? 10 : 0)) * 1000 * progressPercentage);
              const nextItemIndex = timeIndex.findIndex(val => val > currentTime);
              // console.log(nextItemIndex);
              const scrollTarget = commentsList.children[nextItemIndex];
              scrollPosition = scrollTarget.offsetTop - window.innerHeight + scrollTarget.offsetHeight + 2;
              window.scrollTo({top: scrollPosition, behavior: 'instant'});
              // console.log(currentTime);
            }
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
    const scrollPosition = isSmallWindow() ? li.offsetTop - (header.offsetHeight + 10 + config.offsetHeight + 2 + 10) : li.offsetTop - (window.innerHeight - header.offsetHeight - li.offsetHeight) / 2;
    const behavior = e.isTrusted ? 'smooth' : 'instant';
    window.scrollTo({top: scrollPosition, behavior});
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
    Object.entries(rawMeta).forEach(([key, value]) => {
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

  if (window.opener) {
    document.addEventListener('keydown', e => {
      const sendTargetKeys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', ' '];
      const matched = sendTargetKeys.some(key => key === e.key);
      if (matched) {
        e.preventDefault();
        window.opener?.postMessage({
            eventName: 'keyDown',
            data: e.key
        }, 'https://www.nicovideo.jp');
      }
    });
  } else {
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
  }
});