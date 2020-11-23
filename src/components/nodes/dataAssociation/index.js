import component from './dataAssociation.vue';
import idConfigSettings from '@/components/inspectors/idConfigSettings';

export const id  = 'processmaker-modeler-data-association';

export default {
  id,
  component,
  bpmnType: ['bpmn:DataAssociation', 'bpmn:DataOutputAssociation'],
  control: false,
  definition(moddle) {
    return moddle.create('bpmn:DataAssociation');
  },
  inspectorConfig: [
    {
      name: 'Data Association',
      items: [
        {
          component: 'FormAccordion',
          container: true,
          config: {
            initiallyOpen: true,
            label: 'Configuration',
            icon: 'cog',
            name: 'inspector-accordion',
          },
          items: [
            {
              component: 'FormInput',
              config: idConfigSettings,
            },
          ],
        },
      ],
    },
  ],
};
