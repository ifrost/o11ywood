import { getPrintProfiles } from '../screenplay/printProfile';
import { getBasicStats } from '../../fountain/queries';
import { default as awParser } from 'aw-parser';
import { default as awLiner } from 'aw-liner';

export const parseScreenplay = (screenplay: string) => {
  const config = {
    print_headers: true,
    print_actions: true,
    print_dialogues: true,
    print_notes: false,
    print_sections: false,
    print_synopsis: false,
    each_scene_on_new_page: false,
    double_space_between_scenes: false,
    use_dual_dialogue: true,
    merge_multiple_empty_lines: true,
  };
  const parsed = awParser.parser.parse(screenplay, config);
  const liner = new awLiner.Liner(awParser.helpers);

  const lines = liner.line(parsed.tokens, {
    print: getPrintProfiles().usletter,
    text_more: '(MORE)',
    text_contd: "(CONT'D)",
    split_dialogue: true,
  });

  const basics = getBasicStats(getPrintProfiles().usletter).run(lines);

  return { parsed, lines, basics };
};
