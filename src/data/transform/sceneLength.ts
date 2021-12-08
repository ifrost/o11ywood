import { createSceneLength } from '../../fountain/queries';
import { FieldType, MutableDataFrame } from '@grafana/data';
import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';
import { getPrintProfiles } from '../screenplay/printProfile';

/**
 * Scene length histogram.
 * Warning: Scenes longer than 3 minutes.
 */
const WARNING_MINUTES = 3;

export const sceneLength: FountainToFrameTransformation = (screenaplay: string) => {
  const { parsed } = parseScreenplay(screenaplay);
  const queryRunner = createSceneLength();
  const result = queryRunner.run(parsed.tokens, true);

  const frame = new MutableDataFrame({
    refId: 'A',
    fields: [
      { name: 'scene', values: [], type: FieldType.string },
      { name: 'length', values: [], type: FieldType.number },
    ],
  });

  const linesPerPage = getPrintProfiles().usletter.lines_per_page;
  const counter = 0;

  result.forEach(({ header, length, location_type, type }, index) => {
    const pages = length / linesPerPage;
    if (pages > 3) {
      counter++;
    }
    frame.add({ scene: '' + (index + 1).toString(), length: pages });
  });

  let message = '';
  if (counter) {
    message += `${counter} of scenes are longer than 3 pages. Consider splitting them into multiple scenes. `;
  }

  return { frames: [frame], message };
};
