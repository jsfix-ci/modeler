<template>
  <div>
    <form-multi-select
      :label="$t('Process')"
      name="Process"
      :helper="$t('Select which Process this element calls')"
      v-model="selectedProcess"
      :showLabels="false"
      :allow-empty="false"
      :disabled="processList.length === 0"
      :options="processList"
      optionContent="name"
      class="p-0 mb-2"
      validation="required"
      @search-change="searchChange"
      :searchable="true"
      :internal-search="false"
      :preserve-search="true"
      :clear-on-select="false"
    />

    <form-multi-select
      :label="$t('Start Event')"
      name="StartEvent"
      v-if="selectedProcess"
      v-model="selectedStartEvent"
      :disabled="startEventList.length === 0"
      :allow-empty="false"
      :showLabels="false"
      :options="startEventList"
      optionContent="name"
      class="p-0 mb-2"
      validation="required"
    />

    <a
      v-if="selectedProcess"
      :href="`/modeler/${selectedProcess.id}`"
      target="_blank"
    >
      {{ $t('Open Process') }}
      <i class="ml-1 fas fa-external-link-alt"/>
    </a>
  </div>
</template>

<script>
import uniqBy from 'lodash/uniqBy';

export default {
  data() {
    return {
      selectedProcess: null,
      selectedStartEvent: null,
      config: {},
      name: '',
      loading: false ,
      processes: [],
      selectedProcessInfo: null,
    };
  },
  inheritAttrs: false,
  props: ['value'],
  computed: {
    processList() {
      const list = this.filterValidProcesses(this.processes) || [];
      if (this.selectedProcessInfo && !list.find(p => p.id === this.selectedProcessInfo.id)) {
        list.push(this.selectedProcessInfo);
      }
      return list;
    },
    startEventList() {
      if (!this.selectedProcess) { return []; }
      return this.filterValidStartEvents(this.selectedProcess.events);
    },
    currentProcessId() {
      const match = window.location.href.match(/modeler\/(\d+)/);
      if (match && match[1]) {
        return parseInt(match[1]);
      }
      return null;
    },
  },
  watch: {
    selectedProcess() {
      if (this.loading) { return; }
      if (this.startEventList.length > 0) {
        this.selectedStartEvent = this.startEventList[0];
      } else {
        this.selectedStartEvent = null;
      }
    },
    selectedStartEvent() {
      if (this.loading) { return; }
      this.setBpmnValues();
    },
    processList() {
      this.loadBpmnValues();
    },
    value: {
      handler() {
        this.config = JSON.parse(this.value);
        this.loadSelectedProcessInfo();
      },
      immediate: true,
    },
  },
  methods: {
    searchChange(filter) {
      this.loadProcesses(filter);
    },
    filterValidProcesses(processes) {
      return processes.filter(process => {
        return this.filterValidStartEvents(process.events).length > 0;
      }).filter(process => process.id !== this.currentProcessId);
    },
    filterValidStartEvents(events) {
      return events.filter(event => {
        // Should not have event definitions like (signal, message, timer, ...)
        if (event.eventDefinitions && event.eventDefinitions.length > 0) {
          return false;
        }
        // Should not be a web entry
        if (event.config) {
          try {
            const config = JSON.parse(event.config);
            if (config.web_entry) {
              return false;
            }
          } catch (e) {
            // Invalid config property
            return false;
          }
        }
        return true;
      });
    },
    loadBpmnValues() {
      if (!this.config.processId || !this.config.startEvent) {
        return;
      }

      this.loading = true;
      this.name = this.config.name;
      this.selectedProcess = this.processList.find(p => p.id === this.config.processId);
      this.selectedStartEvent = this.startEventList.find(se => se.id === this.config.startEvent);
      this.$nextTick(() => {
        this.loading = false;
      });
    },
    setBpmnValues() {
      if (!this.selectedProcess || !this.selectedStartEvent) {
        return;
      }

      let name = this.selectedProcess.name;
      if (this.startEventList.length > 1) {
        name += ` (${this.selectedStartEvent.name})`;
      }

      const emit = {
        calledElement: `${this.selectedStartEvent.ownerProcessId}-${this.selectedProcess.id}`,
        processId: this.selectedProcess.id,
        startEvent: this.selectedStartEvent.id,
        name,
      };
      const stringValue = JSON.stringify(emit);
      this.$emit('input', stringValue);
    },
    containsMultipleProcesses(process) {
      return uniqBy(process.events, 'ownerProcessId').length > 1;
    },
    loadProcesses(filter) {
      this.loading = true;

      const params = {
        order_direction: 'asc',
        per_page: 20,
        status: 'all',
        include: 'events,category',
      };

      if (filter) {
        params.filter = filter;
      }

      window.ProcessMaker.apiClient.get('processes', {
        params,
      }).then(response => {
        this.loading = false;
        this.processes = response.data.data;
      })
        .catch(() => {
          this.loading = false;
        });
    },
    loadSelectedProcessInfo() {
      if (this.config.processId) {
        window.ProcessMaker.apiClient.get('processes/' + this.config.processId, { params: {
          include: 'events,category',
        } }).then(response => {
          this.selectedProcessInfo = response.data;
        });
      }
    },
  },
  created() {
    if (this.processList.length === 0) {
      this.loadProcesses();
    } else {
      this.loadBpmnValues();
    }
  },
};
</script>
