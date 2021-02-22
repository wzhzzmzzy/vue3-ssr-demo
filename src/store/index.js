import Vue from 'vue'
import { createStore } from 'vuex'

Vue.use(Vuex)

export function _createStore () {
  return createStore({
    state() {
      return {
        count: 0
      }
    }
  });
}
