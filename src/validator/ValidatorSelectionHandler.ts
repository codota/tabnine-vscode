import {  TextEditor } from 'vscode';
import { tabNineProcess } from '../TabNine';
import { Completion } from './ValidatorClient';
import { CompletionOrigin } from '../extension'

export const VALIDATOR_SELECTION_COMMAND = 'tabnine-validator-select';

export async function validatorSelectionHandler(editor: TextEditor, edit, {currentSuggestion, allSuggestions, reference }) {
    try {
        const eventData = eventDataOf(editor, currentSuggestion, allSuggestions, reference);
        tabNineProcess.setState(eventData);
    } catch (error) {
        console.error(error);
    }
}

function eventDataOf(editor: TextEditor, currentSuggestion: Completion, allSuggestions: Completion[], reference: string) {
    let index = allSuggestions.findIndex(sug => sug === currentSuggestion)
    let suggestions = allSuggestions.map(sug => {
        return { 
            length: sug.value.length, 
            strength: resolveDetailOf(sug),
            origin: CompletionOrigin.CLOUD
        };
    });


    const length = currentSuggestion.value.length;
    const strength = suggestions[index].strength;
    const origin = CompletionOrigin.CLOUD;
    const language = editor.document.fileName.split('.').pop();
    const numOfSuggestions = allSuggestions.length;

    const eventData = {
        "ValidatorSelection": {
            language: language,
            length: length,
            strength: strength,
            origin: origin,
            index: index,
            num_of_suggestions: numOfSuggestions,
            suggestions: suggestions,
            reference: reference
        }
    };

    return eventData;
}

function resolveDetailOf(completion: Completion): string {
    return `${completion.score}%`
}