import gql from 'graphql-tag'
import { VERSION } from '~/constants/terms-and-conditions-version.js'

export const state = () => {
  return {
    user: null,
    token: null,
    pending: false,
  }
}

export const mutations = {
  SET_USER(state, user) {
    state.user = user || null
  },
  SET_TOKEN(state, token) {
    state.token = token || null
  },
  SET_PENDING(state, pending) {
    state.pending = pending
  },
}

export const getters = {
  isAuthenticated(state) {
    return !!state.token
  },
  isLoggedIn(state) {
    return !!(state.user && state.token)
  },
  pending(state) {
    return !!state.pending
  },
  isAdmin(state) {
    return !!state.user && state.user.role === 'admin'
  },
  isModerator(state) {
    return !!state.user && (state.user.role === 'admin' || state.user.role === 'moderator')
  },
  user(state) {
    return state.user || {}
  },
  token(state) {
    return state.token
  },
  termsAndConditionsAgreed(state) {
    return state.user && state.user.termsAndConditionsAgreedVersion === VERSION
  },
}

export const actions = {
  async init({ commit, dispatch }) {
    if (!process.server) {
      return
    }
    const token = this.app.$apolloHelpers.getToken()
    if (!token) {
      return
    }
    commit('SET_TOKEN', token)
    await dispatch('fetchCurrentUser')
  },

  async check({ commit, dispatch, getters }) {
    if (!this.app.$apolloHelpers.getToken()) {
      await dispatch('logout')
    }
    return getters.isLoggedIn
  },

  async fetchCurrentUser({ commit, dispatch }) {
    const client = this.app.apolloProvider.defaultClient
    const {
      data: { currentUser },
    } = await client.query({
      query: gql`
        query {
          currentUser {
            id
            name
            slug
            email
            avatar
            role
            about
            locationName
            locale
            contributionsCount
            commentedCount
            allowEmbedIframes
            termsAndConditionsAgreedVersion
            socialMedia {
              id
              url
            }
          }
        }
      `,
    })
    if (!currentUser) return dispatch('logout')
    commit('SET_USER', currentUser)
    return currentUser
  },

  async login({ commit, dispatch }, { email, password }) {
    commit('SET_PENDING', true)
    try {
      const client = this.app.apolloProvider.defaultClient
      const {
        data: { login },
      } = await client.mutate({
        mutation: gql(`
            mutation($email: String!, $password: String!) {
              login(email: $email, password: $password)
            }
          `),
        variables: {
          email,
          password,
        },
      })
      await this.app.$apolloHelpers.onLogin(login)
      commit('SET_TOKEN', login)
      await dispatch('fetchCurrentUser')
    } catch (err) {
      throw new Error(err)
    } finally {
      commit('SET_PENDING', false)
    }
  },

  async logout({ commit }) {
    commit('SET_USER', null)
    commit('SET_TOKEN', null)
    return this.app.$apolloHelpers.onLogout()
  },
}
