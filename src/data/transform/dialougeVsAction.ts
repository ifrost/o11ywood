import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';
import { FieldType, MutableDataFrame } from '@grafana/data';

export const dialougeVsAction: FountainToFrameTransformation = (screenaplay: string) => {
  const { basics } = parseScreenplay(screenaplay);
  const data = new MutableDataFrame({
    refId: 'A',
    fields: [
      { name: 'Action', type: FieldType.number },
      { name: 'Dialogue', type: FieldType.number },
    ],
  });
  data.add({ Action: basics.action_time, Dialogue: basics.dialogue_time });
  return {
    frames: [data],
  };
};
