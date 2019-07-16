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

/**
 * Mapping of Events by DOM selector.
 * Events are matched by selector and their handlers called.
 * @type {Array}
 */
const EVENTS_MAPPING = [
	{
		selector: '.block-editor-block-types-list__item',
		handler: ( event, target ) => {
			const targetClassname = Array.from( target.classList ).filter( className =>
				className.includes( 'editor-block-list-item-' )
			);

			if ( ! targetClassname.length ) {
				return;
			}

			// The block name is stored within the className attribute of the `button`
			// https://github.com/WordPress/gutenberg/blob/5a3c3586024fbb0b9e0276b5e31103ddf83edd52/packages/block-editor/src/components/block-types-list/index.js#L22.
			const blockName = targetClassname[ 0 ].replace( 'editor-block-list-item-', '' );

			tracksRecordEvent( 'wpcom_block_picker_block_inserted', {
				blockName: blockName,
			} );
		},
	},
	{
		selector: '.block-editor-block-settings-menu__control',
		handler: ( event, target ) => {
			const hasCorrectText = target.innerText.toLowerCase().includes( 'remove block' );
			const hasCorrectIcon = target.querySelector( 'svg' ).classList.contains( 'dashicons-trash' );

			if ( hasCorrectText || hasCorrectIcon ) {
				tracksRecordEvent( 'wpcom_block_deleted' );
			}
		},
	},
];

/**
 * Handles delegation of click tracking events.
 * Matches an event against list of known events
 * and for each match fires an appropriate handler function.
 *
 * @param  {Object} event DOM event for the click event
 * @return {void}
 */
const delegateClickTracking = function( event ) {
	const matchingEvents = EVENTS_MAPPING.reduce( ( acc, mapping ) => {
		const target = event.target.matches( mapping.selector )
			? event.target
			: event.target.closest( mapping.selector );

		if ( target ) {
			acc.push( {
				mapping: mapping,
				event: event,
				target: target,
			} );
		}

		return acc;
	}, [] );

	if ( ! matchingEvents.length ) {
		return;
	}

	matchingEvents.forEach( match => match.mapping.handler( match.event, match.target ) );
};

/**
 * Registers Plugin
 */
registerPlugin( 'wpcom-block-editor-tracking', {
	render: () => {
		document.addEventListener( 'click', delegateClickTracking );
		return null;
	},
} );
