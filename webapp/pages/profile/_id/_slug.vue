<template>
  <div>
    <ds-card v-if="user && user.image">
      <p>PROFILE IMAGE</p>
    </ds-card>
    <ds-space />
    <ds-flex v-if="user" :width="{ base: '100%' }" gutter="base">
      <ds-flex-item :width="{ base: '100%', sm: 2, md: 2, lg: 1 }">
        <ds-card
          :class="{ 'disabled-content': user.disabled }"
          style="position: relative; height: auto;"
        >
          <hc-upload v-if="myProfile" :user="user">
            <hc-avatar :user="user" class="profile-avatar" size="x-large"></hc-avatar>
          </hc-upload>
          <hc-avatar v-else :user="user" class="profile-avatar" size="x-large" />
          <!-- Menu -->
          <client-only>
            <content-menu
              placement="bottom-end"
              resource-type="user"
              :resource="user"
              :is-owner="myProfile"
              class="user-content-menu"
              @block="block"
              @unblock="unblock"
            />
          </client-only>
          <ds-space margin="small">
            <ds-heading tag="h3" align="center" no-margin>
              {{ userName }}
            </ds-heading>
            <ds-text align="center" color="soft">
              {{ userSlug }}
            </ds-text>
            <ds-text v-if="user.location" align="center" color="soft" size="small">
              <ds-icon name="map-marker" />
              {{ user.location.name }}
            </ds-text>
            <ds-text align="center" color="soft" size="small">
              {{ $t('profile.memberSince') }} {{ user.createdAt | date('MMMM yyyy') }}
            </ds-text>
          </ds-space>
          <ds-space v-if="user.badges && user.badges.length" margin="x-small">
            <hc-badges :badges="user.badges" />
          </ds-space>
          <ds-flex>
            <ds-flex-item>
              <client-only>
                <ds-number :label="$t('profile.followers')">
                  <hc-count-to
                    slot="count"
                    :start-val="followedByCountStartValue"
                    :end-val="user.followedByCount"
                  />
                </ds-number>
              </client-only>
            </ds-flex-item>
            <ds-flex-item>
              <client-only>
                <ds-number :label="$t('profile.following')">
                  <hc-count-to slot="count" :end-val="user.followingCount" />
                </ds-number>
              </client-only>
            </ds-flex-item>
          </ds-flex>
          <ds-space margin="small">
            <template v-if="!myProfile">
              <hc-follow-button
                v-if="!user.isBlocked"
                :follow-id="user.id"
                :is-followed="user.followedByCurrentUser"
                @optimistic="optimisticFollow"
                @update="updateFollow"
              />
              <ds-button v-else fullwidth @click="unblock(user)">
                {{ $t('settings.blocked-users.unblock') }}
              </ds-button>
            </template>
          </ds-space>
          <template v-if="user.about">
            <hr />
            <ds-space margin-top="small" margin-bottom="small">
              <ds-text color="soft" size="small" class="hyphenate-text">{{ user.about }}</ds-text>
            </ds-space>
          </template>
        </ds-card>
        <ds-space />
        <ds-heading tag="h3" soft style="text-align: center; margin-bottom: 10px;">
          {{ $t('profile.network.title') }}
        </ds-heading>
        <ds-card style="position: relative; height: auto;">
          <ds-space v-if="user.following && user.following.length" margin="x-small">
            <ds-text tag="h5" color="soft">
              {{ userName | truncate(15) }} {{ $t('profile.network.following') }}
            </ds-text>
          </ds-space>
          <template v-if="user.following && user.following.length">
            <ds-space v-for="follow in uniq(user.following)" :key="follow.id" margin="x-small">
              <!-- TODO: find better solution for rendering errors -->
              <client-only>
                <user :user="follow" :trunc="15" />
              </client-only>
            </ds-space>
            <ds-space v-if="user.followingCount - user.following.length" margin="small">
              <ds-text size="small" color="softer">
                {{
                  $t('profile.network.andMore', {
                    number: user.followingCount - user.following.length,
                  })
                }}
              </ds-text>
            </ds-space>
          </template>
          <template v-else>
            <p style="text-align: center; opacity: .5;">
              {{ userName }} {{ $t('profile.network.followingNobody') }}
            </p>
          </template>
        </ds-card>
        <ds-space />
        <ds-card style="position: relative; height: auto;">
          <ds-space v-if="user.followedBy && user.followedBy.length" margin="x-small">
            <ds-text tag="h5" color="soft">
              {{ userName | truncate(15) }} {{ $t('profile.network.followedBy') }}
            </ds-text>
          </ds-space>
          <template v-if="user.followedBy && user.followedBy.length">
            <ds-space v-for="follow in uniq(user.followedBy)" :key="follow.id" margin="x-small">
              <!-- TODO: find better solution for rendering errors -->
              <client-only>
                <user :user="follow" :trunc="15" />
              </client-only>
            </ds-space>
            <ds-space v-if="user.followedByCount - user.followedBy.length" margin="small">
              <ds-text size="small" color="softer">
                {{
                  $t('profile.network.andMore', {
                    number: user.followedByCount - user.followedBy.length,
                  })
                }}
              </ds-text>
            </ds-space>
          </template>
          <template v-else>
            <p style="text-align: center; opacity: .5;">
              {{ userName }} {{ $t('profile.network.followedByNobody') }}
            </p>
          </template>
        </ds-card>
        <ds-space v-if="user.socialMedia && user.socialMedia.length" margin="large">
          <ds-card style="position: relative; height: auto;">
            <ds-space margin="x-small">
              <ds-text tag="h5" color="soft">
                {{ $t('profile.socialMedia') }} {{ userName | truncate(15) }}?
              </ds-text>
              <template>
                <ds-space v-for="link in socialMediaLinks" :key="link.username" margin="x-small">
                  <a :href="link.url" target="_blank">
                    <ds-avatar :image="link.favicon" />
                    {{ link.username }}
                  </a>
                </ds-space>
              </template>
            </ds-space>
          </ds-card>
        </ds-space>
      </ds-flex-item>

      <ds-flex-item :width="{ base: '100%', sm: 3, md: 5, lg: 3 }">
        <masonry-grid class="user-profile-posts-list">
          <ds-grid-item class="profile-top-navigation" :row-span="3" column-span="fullWidth">
            <ds-card class="ds-tab-nav">
              <ul class="Tabs">
                <li class="Tabs__tab pointer" :class="{ active: tabActive === 'post' }">
                  <a @click="handleTab('post')">
                    <ds-space margin="small">
                      <client-only placeholder="Loading...">
                        <ds-number :label="$t('common.post', null, user.contributionsCount)">
                          <hc-count-to slot="count" :end-val="user.contributionsCount" />
                        </ds-number>
                      </client-only>
                    </ds-space>
                  </a>
                </li>
                <li class="Tabs__tab pointer" :class="{ active: tabActive === 'comment' }">
                  <a @click="handleTab('comment')">
                    <ds-space margin="small">
                      <client-only placeholder="Loading...">
                        <ds-number :label="$t('profile.commented')">
                          <hc-count-to slot="count" :end-val="user.commentedCount" />
                        </ds-number>
                      </client-only>
                    </ds-space>
                  </a>
                </li>
                <li
                  class="Tabs__tab pointer"
                  :class="{ active: tabActive === 'shout' }"
                  v-if="myProfile"
                >
                  <a @click="handleTab('shout')">
                    <ds-space margin="small">
                      <client-only placeholder="Loading...">
                        <ds-number :label="$t('profile.shouted')">
                          <hc-count-to slot="count" :end-val="user.shoutedCount" />
                        </ds-number>
                      </client-only>
                    </ds-space>
                  </a>
                </li>
              </ul>
            </ds-card>
          </ds-grid-item>

          <ds-grid-item :row-span="2" column-span="fullWidth">
            <ds-space centered>
              <ds-button
                v-if="myProfile"
                v-tooltip="{
                  content: $t('contribution.newPost'),
                  placement: 'left',
                  delay: { show: 500 },
                }"
                :path="{ name: 'post-create' }"
                class="profile-post-add-button"
                icon="plus"
                size="large"
                primary
              />
            </ds-space>
          </ds-grid-item>

          <template v-if="posts.length">
            <masonry-grid-item v-for="post in posts" :key="post.id">
              <hc-post-card
                :post="post"
                :width="{ base: '100%', md: '100%', xl: '50%' }"
                @removePostFromList="removePostFromList"
                @pinPost="pinPost"
                @unpinPost="unpinPost"
              />
            </masonry-grid-item>
          </template>
          <template v-else-if="$apollo.loading">
            <ds-grid-item column-span="fullWidth">
              <ds-space centered>
                <ds-spinner size="base"></ds-spinner>
              </ds-space>
            </ds-grid-item>
          </template>
          <template v-else>
            <ds-grid-item column-span="fullWidth">
              <hc-empty margin="xx-large" icon="file" />
            </ds-grid-item>
          </template>
        </masonry-grid>
        <div
          v-if="hasMore && posts.length >= pageSize"
          v-infinite-scroll="showMoreContributions"
          :infinite-scroll-disabled="$apollo.loading"
          :infinite-scroll-distance="10"
          :infinite-scroll-throttle-delay="800"
          :infinite-scroll-immediate-check="true"
        >
          <hc-load-more :loading="$apollo.loading" @click="showMoreContributions" />
        </div>
      </ds-flex-item>
    </ds-flex>
  </div>
</template>

<script>
import uniqBy from 'lodash/uniqBy'
import User from '~/components/User/User'
import HcPostCard from '~/components/PostCard/PostCard.vue'
import HcFollowButton from '~/components/FollowButton.vue'
import HcCountTo from '~/components/CountTo.vue'
import HcBadges from '~/components/Badges.vue'
import HcLoadMore from '~/components/LoadMore.vue'
import HcEmpty from '~/components/Empty/Empty'
import ContentMenu from '~/components/ContentMenu'
import HcUpload from '~/components/Upload'
import HcAvatar from '~/components/Avatar/Avatar.vue'
import MasonryGrid from '~/components/MasonryGrid/MasonryGrid.vue'
import MasonryGridItem from '~/components/MasonryGrid/MasonryGridItem.vue'
import { profilePagePosts } from '~/graphql/PostQuery'
import UserQuery from '~/graphql/User'
import { Block, Unblock } from '~/graphql/settings/BlockedUsers'
import PostMutations from '~/graphql/PostMutations'

const tabToFilterMapping = ({ tab, id }) => {
  return {
    post: { author: { id } },
    comment: { comments_some: { author: { id } } },
    shout: { shoutedBy_some: { id } },
  }[tab]
}

export default {
  name: 'HcUserProfile',
  components: {
    User,
    HcPostCard,
    HcFollowButton,
    HcCountTo,
    HcBadges,
    HcLoadMore,
    HcEmpty,
    HcAvatar,
    ContentMenu,
    HcUpload,
    MasonryGrid,
    MasonryGridItem,
  },
  transition: {
    name: 'slide-up',
    mode: 'out-in',
  },
  data() {
    const filter = tabToFilterMapping({ tab: 'post', id: this.$route.params.id })
    return {
      User: [],
      posts: [],
      hasMore: true,
      offset: 0,
      pageSize: 6,
      tabActive: 'post',
      filter,
      followedByCountStartValue: 0,
    }
  },
  computed: {
    myProfile() {
      return this.$route.params.id === this.$store.getters['auth/user'].id
    },
    user() {
      return this.User ? this.User[0] : {}
    },
    socialMediaLinks() {
      const { socialMedia = [] } = this.user
      return socialMedia.map(socialMedia => {
        const { url } = socialMedia
        const matches = url.match(/^(?:https?:\/\/)?(?:[^@\n])?(?:www\.)?([^:/\n?]+)/g)
        const [domain] = matches || []
        const favicon = domain ? `${domain}/favicon.ico` : null
        const username = url.split('/').pop()
        return { url, username, favicon }
      })
    },
    userName() {
      const { name } = this.user || {}
      return name || this.$t('profile.userAnonym')
    },
    userSlug() {
      const { slug } = this.user || {}
      return slug && `@${slug}`
    },
  },
  watch: {
    User(val) {
      if (!val || !val.length) {
        throw new Error('User not found!')
      }
    },
  },
  methods: {
    removePostFromList(deletedPost) {
      this.posts = this.posts.filter(post => {
        return post.id !== deletedPost.id
      })
    },
    handleTab(tab) {
      this.tabActive = tab
      this.filter = tabToFilterMapping({ tab, id: this.$route.params.id })
      this.resetPostList()
    },
    uniq(items, field = 'id') {
      return uniqBy(items, field)
    },
    showMoreContributions() {
      const { profilePagePosts: PostQuery } = this.$apollo.queries
      if (!PostQuery) return // seems this can be undefined on subpages
      this.offset += this.pageSize

      PostQuery.fetchMore({
        variables: {
          offset: this.offset,
          filter: this.filter,
          first: this.pageSize,
          orderBy: 'createdAt_desc',
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult || fetchMoreResult.profilePagePosts.length < this.pageSize) {
            this.hasMore = false
          }
          const result = {
            ...previousResult,
            profilePagePosts: [
              ...previousResult.profilePagePosts.filter(prevPost => {
                return (
                  fetchMoreResult.profilePagePosts.filter(newPost => newPost.id === prevPost.id)
                    .length === 0
                )
              }),
              ...fetchMoreResult.profilePagePosts,
            ],
          }
          return result
        },
      })
    },
    resetPostList() {
      this.offset = 0
      this.posts = []
      this.hasMore = true
    },
    async block(user) {
      await this.$apollo.mutate({ mutation: Block(), variables: { id: user.id } })
      this.$apollo.queries.User.refetch()
      this.resetPostList()
      this.$apollo.queries.profilePagePosts.refetch()
    },
    async unblock(user) {
      await this.$apollo.mutate({ mutation: Unblock(), variables: { id: user.id } })
      this.$apollo.queries.User.refetch()
      this.resetPostList()
      this.$apollo.queries.profilePagePosts.refetch()
    },
    pinPost(post) {
      this.$apollo
        .mutate({
          mutation: PostMutations().pinPost,
          variables: { id: post.id },
        })
        .then(() => {
          this.$toast.success(this.$t('post.menu.pinnedSuccessfully'))
          this.resetPostList()
          this.$apollo.queries.profilePagePosts.refetch()
        })
        .catch(error => this.$toast.error(error.message))
    },
    unpinPost(post) {
      this.$apollo
        .mutate({
          mutation: PostMutations().unpinPost,
          variables: { id: post.id },
        })
        .then(() => {
          this.$toast.success(this.$t('post.menu.unpinnedSuccessfully'))
          this.resetPostList()
          this.$apollo.queries.profilePagePosts.refetch()
        })
        .catch(error => this.$toast.error(error.message))
    },
    optimisticFollow({ followedByCurrentUser }) {
      /*
       * Note: followedByCountStartValue is updated to avoid counting from 0 when follow/unfollow
       */
      this.followedByCountStartValue = this.user.followedByCount
      const currentUser = this.$store.getters['auth/user']
      if (followedByCurrentUser) {
        this.user.followedByCount++
        this.user.followedBy = [currentUser, ...this.user.followedBy]
      } else {
        this.user.followedByCount--
        this.user.followedBy = this.user.followedBy.filter(user => user.id !== currentUser.id)
      }
      this.user.followedByCurrentUser = followedByCurrentUser
    },
    updateFollow({ followedByCurrentUser, followedBy, followedByCount }) {
      this.followedByCountStartValue = this.user.followedByCount
      this.user.followedByCount = followedByCount
      this.user.followedByCurrentUser = followedByCurrentUser
      this.user.followedBy = followedBy
    },
  },
  apollo: {
    profilePagePosts: {
      query() {
        return profilePagePosts(this.$i18n)
      },
      variables() {
        return {
          filter: this.filter,
          first: this.pageSize,
          offset: 0,
          orderBy: 'createdAt_desc',
        }
      },
      update({ profilePagePosts }) {
        this.posts = profilePagePosts
      },
      fetchPolicy: 'cache-and-network',
    },
    User: {
      query() {
        return UserQuery(this.$i18n)
      },
      variables() {
        return { id: this.$route.params.id }
      },
      fetchPolicy: 'cache-and-network',
    },
  },
}
</script>

<style lang="scss">
.pointer {
  cursor: pointer;
}

.Tabs {
  position: relative;
  background-color: #fff;
  height: 100%;
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;

  &__tab {
    text-align: center;
    height: 100%;
    flex-grow: 1;

    &:hover {
      border-bottom: 2px solid #c9c6ce;
    }

    &.active {
      border-bottom: 2px solid #17b53f;
    }
  }
}
.profile-avatar.ds-avatar {
  display: block;
  margin: auto;
  margin-top: -60px;
  border: #fff 5px solid;
}
.page-name-profile-id-slug {
  .ds-flex-item:first-child .content-menu {
    position: absolute;
    top: $space-x-small;
    right: $space-x-small;
  }
}
.profile-top-navigation {
  position: sticky;
  top: 53px;
  z-index: 2;
}
.ds-tab-nav {
  .ds-card-content {
    padding: 0 !important;
    .ds-tab-nav-item {
      &.ds-tab-nav-item-active {
        border-bottom: 3px solid #17b53f;
        &:first-child {
          border-bottom-left-radius: $border-radius-x-large;
        }
        &:last-child {
          border-bottom-right-radius: $border-radius-x-large;
        }
      }
    }
  }
}
.profile-post-add-button {
  box-shadow: $box-shadow-x-large;
}
</style>
