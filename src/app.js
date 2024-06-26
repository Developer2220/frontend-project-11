import * as yup from 'yup';
import onChange from 'on-change';
import render from './view.js';
import i18next from 'i18next';
import ru from './locales/ru.js';
import axios from 'axios';
import parser from './parser.js';
import _ from 'lodash' 

  //get response 
  // const getAxiosResponse = (url) => {
  //   return axios.get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`)
      // .then((response) => {
      //   if (response.data.status === 200) {
      //     return response.data.contents;
      //   } else {
      //     console.error('Error getting data');
      //     return null;
      //   }
      // })
      // .catch((error) => {
      //   console.error('Error getting data', error);
      //   return null;
      // });
  // };
  const getAxiosResponse = (link) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(link)}`);

  // const url = 'https://ru.hexlet.io/lessons.rss';

  // getAxiosResponse(url).then((res)=> console.log(res))


const app = () => {
 // step 1: get DOM elements
 const elements = {
  form: document.querySelector('form'),
  buttonSubmit: document.querySelector('button[type="submit"]'),
  input: document.querySelector('#url-input'),
  feedback: document.querySelector('.feedback'), // a message at the bottom of input
  posts: document.querySelector('.posts'),
  feeds: document.querySelector('.feeds'),
};

  // step 2: init state
  const initialState = {
    form: {
      field: '',
      status: 'filling',
      valid: 'valid',
      addedLinks: [], // save already addded links
      errors: [],
      feeds: [],
      posts: [], 
    },
  };

// const state = {
//   form: {
//     isError: null,
//     message: '',
//   },
//   feeds: [],
// };

// step 3: init i18Next
const i18Instance = i18next.createInstance();
const defaultLang = 'ru';
i18Instance.init({
  lng: defaultLang,
  resources: { // get from /locales/ru.js
    ru,
  },
})

  // step 4: set locale "notOneOf()" for using links were already added
  .then(() => {
    yup.setLocale({
      mixed: {
        notOneOf: i18Instance.t('addedLink'),
      },
      string: {
        url: i18Instance.t('invalidLink'),
      },
    });

    // step 5: watch for state
    const watchedState = onChange(initialState, render(initialState, elements, i18Instance));
console.log('watchedState', watchedState)

    const addFeeds = (id, title, description, watchedState) => {
      watchedState.form.feeds.push({ id, title, description });
    };
  
    const addPosts = (feedId, posts, watchedState) => {
      const result = posts.map((post) => ({
        feedId,
        id: _.uniqueId(),
        title: post.title,
        description: post.description,
        link: post.link,
      }));
      watchedState.form.posts = result.concat(watchedState.form.posts);
    };
// const watchedState = onChange(state, render)

elements.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const value = formData.get('url'); // get value in input

  yup
          .string()
          .trim()
          .url(i18Instance.t('errors.invalidLink')) // instead of message of error - message from locales/ru.js
          .notOneOf(watchedState.form.addedLinks, i18Instance.t('errors.addedLink')) // the same
          .validate(value) // check validation
          .then((url) => getAxiosResponse(url)) // return xmlDocument
          .then((responce)=> parser(responce.data.contents)) // return {feed, posts}
          .then ((parsedRSS) => {
            const title = parsedRSS.feed.channelTitle;
            // console.log(title)
            const description = parsedRSS.feed.channelDescription;
            // console.log(description)
            const feedId = _.uniqueId();
            // console.log('feedId', feedId )
            // console.log(feedId)
            
            // watchedState.form.feeds.push({ feedId, title, description });
            addFeeds(feedId, title, description, watchedState)
            addPosts(feedId,parsedRSS.posts, watchedState);
            console.log('parsedRSS', parsedRSS);
          })

          .then(() => { // in case - validation
            watchedState.form.valid = 'valid';
            watchedState.form.status = 'sending';
          })
          .then(() => { // add in alreadyAdded when previous success
            watchedState.form.addedLinks.push(value);
            watchedState.form.status = 'sent';
            watchedState.form.field = value;
          })
          .catch((error) => { // in case no-valid (if error is on during 'sending' or smth else)
            watchedState.form.valid = 'invalid';
            watchedState.form.errors = error.message; // push error
            watchedState.form.status = 'failed';
          })
          .finally(() => {
            watchedState.form.status = 'filling';
          });
      });
    });
};


export default app;
