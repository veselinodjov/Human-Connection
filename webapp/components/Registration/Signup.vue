<template>
  <ds-space v-if="!data && !error" margin="large">
    <ds-form
      @input="handleInput"
      @input-valid="handleInputValid"
      v-model="formData"
      :schema="formSchema"
      @submit="handleSubmit"
    >
      <h1>
        {{ invitation ? $t('profile.invites.title') : $t('components.registration.signup.title') }}
      </h1>
      <ds-space v-if="token" margin-botton="large">
        <ds-text v-html="$t('registration.signup.form.invitation-code', { code: token })" />
      </ds-space>
      <ds-space margin-botton="large">
        <ds-text>
          {{
            invitation
              ? $t('profile.invites.description')
              : $t('components.registration.signup.form.description')
          }}
        </ds-text>
      </ds-space>
      <ds-input
        :placeholder="invitation ? $t('profile.invites.emailPlaceholder') : $t('login.email')"
        type="email"
        id="email"
        model="email"
        name="email"
        icon="envelope"
      />
      <ds-button
        :disabled="disabled"
        :loading="$apollo.loading"
        primary
        fullwidth
        name="submit"
        type="submit"
        icon="envelope"
      >
        {{ $t('components.registration.signup.form.submit') }}
      </ds-button>
      <slot></slot>
    </ds-form>
  </ds-space>
  <div v-else margin="large">
    <template v-if="!error">
      <transition name="ds-transition-fade">
        <sweetalert-icon icon="info" />
      </transition>
      <ds-text align="center" v-html="submitMessage" />
    </template>
    <template v-else>
      <transition name="ds-transition-fade">
        <sweetalert-icon icon="error" />
      </transition>
      <ds-text align="center">{{ error.message }}</ds-text>
    </template>
  </div>
</template>

<script>
import gql from 'graphql-tag'
import { SweetalertIcon } from 'vue-sweetalert-icons'

export const SignupMutation = gql`
  mutation($email: String!) {
    Signup(email: $email) {
      email
    }
  }
`
export const SignupByInvitationMutation = gql`
  mutation($email: String!, $token: String!) {
    SignupByInvitation(email: $email, token: $token) {
      email
    }
  }
`
export default {
  name: 'Signup',
  components: {
    SweetalertIcon,
  },
  props: {
    token: { type: String, default: null },
    invitation: { type: Boolean, default: false },
  },
  data() {
    return {
      formData: {
        email: '',
      },
      formSchema: {
        email: {
          type: 'email',
          required: true,
          message: this.$t('common.validations.email'),
        },
      },
      disabled: true,
      data: null,
      error: null,
    }
  },
  computed: {
    submitMessage() {
      const { email } = this.data.Signup
      return this.$t('components.registration.signup.form.success', { email })
    },
  },
  methods: {
    handleInput() {
      this.disabled = true
    },
    handleInputValid() {
      this.disabled = false
    },
    async handleSubmit() {
      const mutation = this.token ? SignupByInvitationMutation : SignupMutation
      const { token } = this
      const { email } = this.formData

      try {
        const response = await this.$apollo.mutate({ mutation, variables: { email, token } })
        this.data = response.data
        setTimeout(() => {
          this.$emit('submit', { email: this.data.Signup.email })
        }, 3000)
      } catch (err) {
        const { message } = err
        const mapping = {
          'A user account with this email already exists': 'email-exists',
          'Invitation code already used or does not exist': 'invalid-invitation-token',
        }
        for (const [pattern, key] of Object.entries(mapping)) {
          if (message.includes(pattern))
            this.error = {
              key,
              message: this.$t(`components.registration.signup.form.errors.${key}`),
            }
        }
        if (!this.error) {
          this.$toast.error(message)
        }
      }
    },
  },
}
</script>
