import { FountainToFrameTransformation } from './transformations';
import { parseScreenplay } from './parser';
import { FieldType, MutableDataFrame } from '@grafana/data';
import { createCharacters, createCharacterScenes } from '../../fountain/queries';
import { cloneDeep } from 'lodash';

const MAX_CHARACTERS = 10;

export const characterScenes: FountainToFrameTransformation = (screenaplay: string) => {
  const { parsed, basics } = parseScreenplay(screenaplay);
  const queryRunner = createCharacterScenes();
  const results = queryRunner.run(parsed.tokens);

  var topCharacters = createCharacters()
    .run(parsed.tokens, basics, {
      sort_by: 'nof_scenes',
    })
    .splice(0, MAX_CHARACTERS);
  topCharacters.sort(function(a, b) {
    return a.name > b.name ? 1 : -1;
  });
  let topCharactersMap = {};
  topCharacters.forEach(({ name }) => (topCharactersMap[name] = false));
  let topCharactersList = topCharacters.map(({ name }) => name);

  const data = new MutableDataFrame({
    fields: [
      { name: 'Time', type: FieldType.time },
      { name: 'Location', type: FieldType.string },
    ].concat(
      topCharactersList.map(name => {
        return {
          name,
          type: FieldType.boolean,
        };
      })
    ),
  });

  const maxLines = results[results.length - 1].token.line;

  results.forEach(result => {
    let item = cloneDeep(topCharactersMap);
    topCharactersList.forEach(name => {
      if (result[name]) {
        item[name] = true;
      } else {
        item[name] = false;
      }
    });
    item.Location = result.token.text;
    item.Time = ((basics.pages * result.token.line) / maxLines) * 60 * 1000;
    data.add(item);
  });

  data.add({
    ...topCharactersMap,
    Location: '',
    Time: basics.pages * 60 * 1000,
  });

  console.log(data);

  let message = '';
  if (false) {
    message = 'error';
  }

  return {
    frames: [data],
    message,
  };
};
