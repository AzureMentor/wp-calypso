/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import { withoutHttp } from 'lib/url';
import wpcom from 'lib/wp';
import Site from 'blocks/site';

/**
 * Style dependencies
 */
import './style.scss';

// simple version of `getSiteComputedAttributes`
function withComputedAttributes( site ) {
	return {
		...site,
		title: site.name.trim(),
		domain: withoutHttp( site.URL ),
	};
}

export default function VisitSite( { siteSlug } ) {
	const [ site, setSite ] = React.useState( null );

	React.useEffect( () => {
		wpcom
			.site( siteSlug )
			.get( { apiVersion: '1.2' } )
			.then( withComputedAttributes )
			.then( setSite );
	}, [ siteSlug ] );

	return (
		<div className="visit-site">
			<div className="visit-site__title">Visit:</div>
			<Site site={ site } homeLink />
		</div>
	);
}
