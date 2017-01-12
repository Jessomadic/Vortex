export type DialogType =
  'success' | 'info' | 'error' | 'question';

export type DialogActions = { [label: string]: Function };

export interface IDialog {
  id: string;
  type: DialogType;
  title: string;
  content: IDialogContent;
  actions: string[];
}

export interface ICheckbox {
  id: string;
  text: string;
  value: boolean;
}

export interface IFormControl {
  id: string;
  type: string;
  value: string;
  label: string;
}

export interface IDialogContent {
  htmlFile?: string;
  message?: string;
  checkboxes?: ICheckbox[];
  formcontrol?: IFormControl[];
  options?: {
    translated?: boolean;
    wrap?: boolean;
  };
}

export interface IDialogResult {
  action: string;
  input: any;
}
