<template>
  <div class="user" v-if="displayAnonymous">
    <hc-avatar class="avatar" />
    <div>
      <b class="username">{{ $t('profile.userAnonym') }}</b>
    </div>
  </div>
  <dropdown v-else :class="{ 'disabled-content': user.disabled }" placement="top-start" offset="0">
    <template slot="default" slot-scope="{ openMenu, closeMenu, isOpen }">
      <nuxt-link :to="userLink" :class="['user', isOpen && 'active']">
        <div @mouseover="openMenu(true)" @mouseleave="closeMenu(true)">
          <hc-avatar class="avatar" :user="user" />
          <div>
            <ds-text>
              <b class="username">{{ userName | truncate(18) }}</b>
              <ds-text v-if="dateTime" size="small" color="soft">
                <ds-icon name="clock" />
                <client-only>
                  <hc-relative-date-time :date-time="dateTime" />
                </client-only>
                <slot name="dateTime"></slot>
              </ds-text>
            </ds-text>
          </div>
          <ds-text align="left" size="small" color="soft">
            {{ userSlug }}
          </ds-text>
        </div>
      </nuxt-link>
    </template>
    <template slot="popover">
      <div style="min-width: 250px">
        <hc-badges v-if="user.badges && user.badges.length" :badges="user.badges" />
        <ds-text
          v-if="user.location"
          align="center"
          color="soft"
          size="small"
          style="margin-top: 5px"
          bold
        >
          <ds-icon name="map-marker" />
          {{ user.location.name }}
        </ds-text>
        <ds-flex style="margin-top: -10px">
          <ds-flex-item class="ds-tab-nav-item">
            <ds-space margin="small">
              <ds-number
                :count="user.followedByCount"
                :label="$t('profile.followers')"
                size="x-large"
              />
            </ds-space>
          </ds-flex-item>
          <ds-flex-item class="ds-tab-nav-item ds-tab-nav-item-active">
            <ds-space margin="small">
              <ds-number
                :count="user.contributionsCount"
                :label="$t('common.post', null, user.contributionsCount)"
              />
            </ds-space>
          </ds-flex-item>
          <ds-flex-item class="ds-tab-nav-item">
            <ds-space margin="small">
              <ds-number
                :count="user.commentedCount"
                :label="$t('common.comment', null, user.commentedCount)"
              />
            </ds-space>
          </ds-flex-item>
        </ds-flex>
        <ds-flex v-if="!itsMe" gutter="x-small" style="margin-bottom: 0;">
          <ds-flex-item>
            <hc-follow-button
              :follow-id="user.id"
              :is-followed="user.followedByCurrentUser"
              @optimistic="optimisticFollow"
              @update="updateFollow"
            />
          </ds-flex-item>
        </ds-flex>
        <!--<ds-space margin-bottom="x-small" />-->
      </div>
    </template>
  </dropdown>
</template>

<script>
import { mapGetters } from 'vuex'

import HcRelativeDateTime from '~/components/RelativeDateTime'
import HcFollowButton from '~/components/FollowButton'
import HcBadges from '~/components/Badges'
import HcAvatar from '~/components/Avatar/Avatar.vue'
import Dropdown from '~/components/Dropdown'

export default {
  name: 'HcUser',
  components: {
    HcRelativeDateTime,
    HcFollowButton,
    HcAvatar,
    HcBadges,
    Dropdown,
  },
  props: {
    user: { type: Object, default: null },
    trunc: { type: Number, default: null },
    dateTime: { type: [Date, String], default: null },
  },
  computed: {
    ...mapGetters({
      isModerator: 'auth/isModerator',
    }),
    itsMe() {
      return this.user.slug === this.$store.getters['auth/user'].slug
    },
    displayAnonymous() {
      const { user, isModerator } = this
      return !user || user.deleted || (user.disabled && !isModerator)
    },
    userLink() {
      const { id, slug } = this.user
      if (!(id && slug)) return ''
      return { name: 'profile-id-slug', params: { slug, id } }
    },
    userSlug() {
      const { slug } = this.user || {}
      return slug && `@${slug}`
    },
    userName() {
      const { name } = this.user || {}
      return name || this.$t('profile.userAnonym')
    },
  },
  methods: {
    optimisticFollow({ followedByCurrentUser }) {
      const inc = followedByCurrentUser ? 1 : -1
      this.user.followedByCurrentUser = followedByCurrentUser
      this.user.followedByCount += inc
    },
    updateFollow({ followedByCurrentUser, followedByCount }) {
      this.user.followedByCount = followedByCount
      this.user.followedByCurrentUser = followedByCurrentUser
    },
  },
}
</script>

<style scoped lang="scss">
.avatar {
  display: inline-block;
  float: left;
  margin-right: 4px;
  height: 100%;
  vertical-align: middle;
}

.user {
  white-space: nowrap;
  position: relative;
  display: flex;
  align-items: center;

  &:hover,
  &.active {
    z-index: 999;
  }
}
</style>
