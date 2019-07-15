/**
 * External dependencies
 */
import { registerPlugin } from '@wordpress/plugins';
import { isObjectLike, isUndefined, omit } from 'lodash';

// In case Tracks hasn't loaded
if ( typeof window !== 'undefined' ) {
	window._tkq = window._tkq || [];
}

// Adapted from the analytics lib :(
// Because this is happening outside of the Calypso app we can't reuse the same lib
// This means we don't have any extra props like user
const tracksRecordEvent = function( eventName, eventProperties ) {
	eventProperties = eventProperties || {};

	if ( process.env.NODE_ENV !== 'production' && typeof console !== 'undefined' ) {
		for ( const key in eventProperties ) {
			if ( isObjectLike( eventProperties[ key ] ) ) {
				const errorMessage =
					`Tracks: Unable to record event "${ eventName }" because nested ` +
					`properties are not supported by Tracks. Check '${ key }' on`;
				console.error( errorMessage, eventProperties ); //eslint-disable-line no-console
				return;
			}

			if ( ! /^[a-z_][a-z0-9_]*$/.test( key ) ) {
				//eslint-disable-next-line no-console
				console.error(
					'Tracks: Event `%s` will be rejected because property name `%s` does not match /^[a-z_][a-z0-9_]*$/. ' +
						'Please use a compliant property name.',
					eventName,
					key
				);
			}
		}
	}

	// Remove properties that have an undefined value
	// This allows a caller to easily remove properties from the recorded set by setting them to undefined
	eventProperties = omit( eventProperties, isUndefined );

	if ( 'undefined' !== typeof window ) {
		window._tkq.push( [ 'recordEvent', eventName, eventProperties ] );
	}
};

const EVENTS_MAPPING = [
	{
		selector: '.block-editor-block-types-list__item',
		handler: function( event ) {
			const blockName = event.target
				.closest( '.block-editor-block-types-list__item' )
				.querySelector( '.block-editor-block-types-list__item-title' ).innerText;

			tracksRecordEvent( 'gutenberg_block_picker_block_inserted', {
				blockName: blockName,
			} );
		},
	},
];

const delegateClickTracking = function( event ) {
	const matchingEvents = EVENTS_MAPPING.filter( mapping => {
		return event.target.matches( mapping.selector ) || event.target.closest( mapping.selector );
	} );

	// console.log(event, matchingEvents);

	if ( ! matchingEvents.length ) {
		return;
	}

	matchingEvents.forEach( match => match.handler( event ) );
};

registerPlugin( 'wpcom-block-editor-tracking', {
	render: () => {
		document.addEventListener( 'click', function( e ) {
			delegateClickTracking( e );
		} );

		return null;
	},
} );
