import {htmlspecialchars} from './utils';

document.addEventListener('DOMContentLoaded', () => {
  const jkLoadForm = document.forms['jk-load'];
  jkLoadForm.channelPicker = jkLoadForm.elements['channel-picker'];
  jkLoadForm.datetimeField = jkLoadForm.querySelector('.datetime-field');
  jkLoadForm._date = jkLoadForm.elements['date'];
  jkLoadForm.timeStart = jkLoadForm.elements['time-start'];
  jkLoadForm.timeEnd = jkLoadForm.elements['time-end'];
  jkLoadForm.dateButtons = jkLoadForm.querySelector('.date-buttons');
  jkLoadForm.dateMinus1D = jkLoadForm.elements['date--1d'];
  jkLoadForm.dateMinus2D = jkLoadForm.elements['date--2d'];
  jkLoadForm.dateMinus5D = jkLoadForm.elements['date--5d'];
  jkLoadForm.dateMinus7D = jkLoadForm.elements['date--7d'];
  jkLoadForm.dateMinus14D = jkLoadForm.elements['date--14d'];
  jkLoadForm.dateMinus1M = jkLoadForm.elements['date--1m'];
  jkLoadForm.dateMinus3M = jkLoadForm.elements['date--3m'];
  jkLoadForm.dateMinus6M = jkLoadForm.elements['date--6m'];
  jkLoadForm.dateMinus1Y = jkLoadForm.elements['date--1y'];
  jkLoadForm.dateMinus5Y = jkLoadForm.elements['date--5y'];
  jkLoadForm.timeButtons = jkLoadForm.querySelector('.time-buttons');
  jkLoadForm.timePlus1H = jkLoadForm.elements['time-+1h'];
  jkLoadForm.timePlus2H = jkLoadForm.elements['time-+2h'];
  jkLoadForm.timePlus6H = jkLoadForm.elements['time-+6h'];
  jkLoadForm.timePlus12H = jkLoadForm.elements['time-+12h'];
  jkLoadForm.timePlus1M = jkLoadForm.elements['time-+1m'];
  jkLoadForm.timePlus2M = jkLoadForm.elements['time-+2m'];
  jkLoadForm.timePlus5M = jkLoadForm.elements['time-+5m'];
  jkLoadForm.timePlus10M = jkLoadForm.elements['time-+10m'];
  jkLoadForm.timePlus30M = jkLoadForm.elements['time-+30m'];
  jkLoadForm.resetButton = jkLoadForm.elements['reset-button'];
  jkLoadForm.submitButton = jkLoadForm.elements['submit-button'];
  const commentsList = document.getElementById('comments-list');
  const detailPc = document.querySelector('.detail-pc');

  const now = new Date();
  // const oneDayAgo = new Date(now);
  // oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  // oneDayAgo.setHours(0);
  // oneDayAgo.setMinutes(-oneDayAgo.getTimezoneOffset());
  // oneDayAgo.setSeconds(0);
  // oneDayAgo.setMilliseconds(0);
  const day = ("0" + now.getDate()).slice(-2);
  const month = ("0" + (now.getMonth() + 1)).slice(-2);
  const today = now.getFullYear()+"-"+(month)+"-"+(day);
  const time = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  const defaultTitle = document.title;

  jkLoadForm._date.value = today;
  jkLoadForm._date.max = today;
  jkLoadForm.timeStart.max = time;
  jkLoadForm.timeEnd.max = time;

  const checkParams = () => {
    if (location.search) {
      const params = new URLSearchParams(location.search);
      const paramValidator = param => {
        if (!params.has(param)) {
          return false;
        }
        const value = params.get(param);
        switch (param) {
          case 'ch':
            const options = jkLoadForm.channelPicker.options;
            return [...options].some(option => option.value === value);
    
          case 'date':
            const dateElem = jkLoadForm._date;
            return value >= dateElem.min && value <= dateElem.max;
    
          case 'timestart':
          case 'timeend':
            return value >= '00:00' && value <= '23:59';
    
          default:
            return false;
        }
      };
    
      if (['ch','date','timestart','timeend'].every(param => paramValidator(param))) {
        jkLoadForm.channelPicker.value = params.get('ch');
        jkLoadForm._date.value = params.get('date');
        jkLoadForm.timeStart.value = params.get('timestart');
        jkLoadForm.timeEnd.disabled = false;
        jkLoadForm.timeEnd.value = params.get('timeend');
        jkLoadForm.resetButton.hidden = false;
        jkLoadForm.submitButton.disabled = false;
        jkLoadForm.requestSubmit();
      } else {
        alert('過去ログの指定が不正でした。');
      }
    }
  }

  //---------------
  // Form Controls
  //---------------

  const buttonJudgement = () => jkLoadForm.submitButton.disabled = Boolean(jkLoadForm.querySelector(':invalid'));

  jkLoadForm.datetimeField.addEventListener('change', buttonJudgement);
  jkLoadForm.datetimeField.addEventListener('click', buttonJudgement);

  let timeEndFocused = false;

  const inputEnableJudgement = () => {
    if(jkLoadForm._date.value !== '' && jkLoadForm.timeStart.value !== ''){
      jkLoadForm.timeEnd.disabled = false;
      if (!timeEndFocused) {
        jkLoadForm.timeEnd.value = jkLoadForm.timeStart.value;
        // const oneMinutesLaterDate = jkLoadForm.timeStart.valueAsDate;
        // oneMinutesLaterDate.setMinutes(oneMinutesLaterDate.getMinutes() + 1);
        // jkLoadForm.timeEnd.valueAsDate = oneMinutesLaterDate;
        buttonJudgement();
      }
    } else {
      jkLoadForm.timeEnd.disabled = true;
    }
    jkLoadForm.resetButton.hidden = false;
  }

  const attachTimeLimit = () => {
    const isYesterdayDate = jkLoadForm._date.valueAsDate.getDate() === now.getDate() - 1;
    const isCanOverflow = jkLoadForm.timeStart.value >= time;
    const isSpanDays = jkLoadForm.timeStart.value >= jkLoadForm.timeEnd.value;
    const compareAndAssign = (target, prop, value) => {
      if (target[prop] !== value) {
        target[prop] = value;
      }
    };

    if (jkLoadForm._date.value === today) {
      compareAndAssign(jkLoadForm.timeStart, 'max', time);
      compareAndAssign(jkLoadForm.timeEnd, 'max', time);
    } else if (isYesterdayDate && isCanOverflow && isSpanDays) {
      compareAndAssign(jkLoadForm.timeStart, 'max', '');
      compareAndAssign(jkLoadForm.timeEnd, 'max', time);
    } else {
      compareAndAssign(jkLoadForm.timeStart, 'max', '');
      compareAndAssign(jkLoadForm.timeEnd, 'max', '');
    }
  }

  [jkLoadForm._date, jkLoadForm.timeStart].forEach(elem => {
    elem.addEventListener('input', inputEnableJudgement);
    elem.addEventListener('input', attachTimeLimit);
  });

  let focusedElem = null;
  [jkLoadForm._date, jkLoadForm.timeStart, jkLoadForm.timeEnd].forEach(elem => {
    elem.addEventListener('focus', e => {
      focusedElem = e.target;
      if(focusedElem.value === '') {
        focusedElem.value = '00:00';
        inputEnableJudgement();
      }
      switch (focusedElem) {
        case jkLoadForm._date:
          jkLoadForm.dateButtons.hidden = false;
          jkLoadForm.timeButtons.hidden = true;
          break;
        case jkLoadForm.timeStart:
        case jkLoadForm.timeEnd:
          jkLoadForm.dateButtons.hidden = true;
          jkLoadForm.timeButtons.hidden = false;
          break;
      }
    });

    elem.addEventListener('click', e => e.preventDefault(), {once: true});

    elem.addEventListener('blur', () => {
      elem.addEventListener('click', e => e.preventDefault(), {once: true});
    });
  });

  jkLoadForm.timeEnd.addEventListener('focus', () => timeEndFocused = true);

  document.addEventListener('click', e => {
    if (!e.target.closest('.jk-load-form')) {
      jkLoadForm.dateButtons.hidden = true;
      jkLoadForm.timeButtons.hidden = true;
    }
  });

  [
    jkLoadForm.dateMinus1D,
    jkLoadForm.dateMinus2D,
    jkLoadForm.dateMinus5D,
    jkLoadForm.dateMinus7D,
    jkLoadForm.dateMinus14D,
    jkLoadForm.dateMinus1M,
    jkLoadForm.dateMinus3M,
    jkLoadForm.dateMinus6M,
    jkLoadForm.dateMinus1Y,
    jkLoadForm.dateMinus5Y,
    jkLoadForm.timePlus1H,
    jkLoadForm.timePlus2H,
    jkLoadForm.timePlus6H,
    jkLoadForm.timePlus12H,
    jkLoadForm.timePlus1M,
    jkLoadForm.timePlus2M,
    jkLoadForm.timePlus5M,
    jkLoadForm.timePlus10M,
    jkLoadForm.timePlus30M
  ].forEach(button => {
    button.addEventListener('click', e => {
      const date = focusedElem.valueAsDate;
      const setDiffDate = num => date.setDate(date.getDate() + num);
      const setDiffMonth = num => date.setMonth(date.getMonth() + num);
      const setDiffYear = num => date.setFullYear(date.getFullYear() + num);
      const setDiffHours = num => date.setHours(date.getHours() + num);
      const setDiffMinutes = num => date.setMinutes(date.getMinutes() + num);

      switch (e.target) {
        case jkLoadForm.dateMinus1D:
          setDiffDate(-1);
          break;
        case jkLoadForm.dateMinus2D:
          setDiffDate(-2);
          break;
        case jkLoadForm.dateMinus5D:
          setDiffDate(-5);
          break;
        case jkLoadForm.dateMinus7D:
          setDiffDate(-7);
          break;
        case jkLoadForm.dateMinus14D:
          setDiffDate(-14);
          break;
        case jkLoadForm.dateMinus1M:
          setDiffMonth(-1);
          break;
        case jkLoadForm.dateMinus3M:
          setDiffMonth(-3);
          break;
        case jkLoadForm.dateMinus6M:
          setDiffMonth(-6);
          break;
        case jkLoadForm.dateMinus1Y:
          setDiffYear(-1);
          break;
        case jkLoadForm.dateMinus5Y:
          setDiffYear(-5);
          break;
        case jkLoadForm.timePlus1H:
          setDiffHours(1);
          break;
        case jkLoadForm.timePlus2H:
          setDiffHours(2);
          break;
        case jkLoadForm.timePlus6H:
          setDiffHours(6);
          break;
        case jkLoadForm.timePlus12H:
          setDiffHours(12);
          break;
        case jkLoadForm.timePlus1M:
          setDiffMinutes(1);
          break;
        case jkLoadForm.timePlus2M:
          setDiffMinutes(2);
          break;
        case jkLoadForm.timePlus5M:
          setDiffMinutes(5);
          break;
        case jkLoadForm.timePlus10M:
          setDiffMinutes(10);
          break;
        case jkLoadForm.timePlus30M:
          setDiffMinutes(30);
          break;
      }
      focusedElem.valueAsDate = date;
      inputEnableJudgement();
      attachTimeLimit();
      buttonJudgement();
    });
  });
  
  const makeHTMLFromComment = comment => {
    comment = comment.chat;
    const formatted = {
      text: htmlspecialchars(comment.content).replace(/\n/g, '<br>'),
      time: new Date(Number(comment.date) * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})
    };
    const html = 
    `<li data-thread="${comment.thread}" data-no="${comment.no}" data-user-id="${comment.user_id}" data-raw="${encodeURI(JSON.stringify(comment))}">
      <span class="text">${formatted.text}</span><span class="time">${formatted.time}</span>
    </li>
    `;
    return html;
  };

  const appendComments = comments => {
    let html = '';
    while (comments.length) {
      html += makeHTMLFromComment(comments.shift());
      // console.log('comment shifted, comments count:', comments.length);
    }
    commentsList.insertAdjacentHTML('beforeend', html);
    // console.log('comment count:',this.querySelectorAll('li').length);
  }

  jkLoadForm.addEventListener('submit', async e => {
    e.preventDefault();
    jkLoadForm.submitButton.disabled = true;
    jkLoadForm.submitButton.textContent = '読み込み中...';
    commentsList.textContent = '';
    const APIURL = new URL(`https://jikkyo.tsukumijima.net/api/kakolog/${jkLoadForm.channelPicker.value}`);
    const APIParams = APIURL.searchParams;
    const toUnixTimeSec = (timeString) => Math.floor(new Date(timeString).getTime() / 1000);
    const startTime = toUnixTimeSec(`${jkLoadForm._date.value}T${jkLoadForm.timeStart.value}`);
    APIParams.append('starttime', startTime);
    const datePlain = new Date(`${jkLoadForm._date.value}T${jkLoadForm.timeEnd.value}`);
    const endTime = jkLoadForm.timeStart.valueAsDate < jkLoadForm.timeEnd.valueAsDate ? toUnixTimeSec(datePlain) : (() => {
      const dateOneDayLater = datePlain.setDate(datePlain.getDate() + 1);
      return toUnixTimeSec(dateOneDayLater);
    })();
    APIParams.append('endtime', endTime);
    APIParams.append('format', 'json');
    await fetch(APIURL)
      .then(async response => {
        // console.log(response);
        const data = await response.json();
        // console.log(data);
        if (response.status === 200) {
          if (data.error) {
            console.error('Error:', data.error);
            alert('エラー:' + data.error);
          } else if (!data.packet.length) {
            console.log('not comments found');
            alert('指定の期間にコメントがありませんでした。');
          } else {
            appendComments(data.packet);
          }
        } else {
          console.log('error or no content', response.status);
        }
      }).catch(e => {
        console.error('Failed to load', e);
      });
    document.title = `${defaultTitle} - ${jkLoadForm.channelPicker.selectedOptions[0].label} ${jkLoadForm._date.value.replaceAll('-','/')} ${jkLoadForm.timeStart.value} - ${jkLoadForm.timeEnd.value}`;
    const params = new URLSearchParams(location.search);
    params.set('ch', jkLoadForm.channelPicker.value);
    params.set('date', jkLoadForm._date.value);
    params.set('timestart', jkLoadForm.timeStart.value);
    params.set('timeend', jkLoadForm.timeEnd.value);
    history.pushState(null, '', `${location.pathname}?${params.toString()}`);
    jkLoadForm.submitButton.disabled = false;
    jkLoadForm.submitButton.textContent = '取得';
  }, {passive: false});

  checkParams();

  jkLoadForm.addEventListener('reset', e => {
    e.preventDefault();
    jkLoadForm._date.value = today;
    jkLoadForm.timeStart.value = '';
    jkLoadForm.timeEnd.value = '';
    jkLoadForm.timeEnd.disabled = true;
    jkLoadForm.dateButtons.hidden = true;
    jkLoadForm.timeButtons.hidden = true;
    jkLoadForm.resetButton.hidden = true;
    jkLoadForm.submitButton.disabled = true;
    timeEndFocused = false;
  }, {passive: false});

  //----------------
  // /Form Controls
  //----------------

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
    const rawMeta = JSON.parse(decodeURI(li.dataset.raw));
    const dl = document.createElement('dl');
    const descList = {
      thread: 'スレッドID',
      no: 'コメント番号',
      vpos: 'スレッド開始時からのコメント経過秒',
      date: '日時',
      date_usec: '日時(小数部)',
      user_id: 'ユーザーID',
      mail: 'コマンド',
      premium: 'プレミアム会員',
      anonymity: '匿名',
      content: 'コメント'
    };
    let html = '';
    Object.keys(rawMeta).forEach(key => {
      let value = rawMeta[key];
      switch (key) {
        case 'vpos':
          value = Number(value) / 100;
          break;
        case 'date':
          value = new Date(Number(value) * 1000)
            .toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'});
          break;
        case 'date_usec':
          value = '0.' + value;
          break;
        case 'premium':
        case 'anonymity':
          value = Boolean(value) ? 'はい' : 'いいえ';
          break;
      }
      html +=
      `<dt>${descList[key]}</dt>
      <dd>${value}</dd>
      `;
    });
    dl.innerHTML = html;
    const commentItems = commentsList.children;
    const newSameUsers = [...commentItems].filter(comment => comment.dataset.userId === rawMeta.user_id);
    const numberOfCommentsFromSameUser = newSameUsers.findIndex(comment => comment.dataset.thread === rawMeta.thread && comment.dataset.no === rawMeta.no) + 1;
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
});