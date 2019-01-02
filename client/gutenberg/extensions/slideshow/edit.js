/** @format */

/**
 * External dependencies
 */

import { __ } from 'gutenberg/extensions/presets/jetpack/utils/i18n';
import { Component, Fragment } from '@wordpress/element';
import {
	BlockControls,
	BlockAlignmentToolbar,
	MediaUpload,
	MediaPlaceholder,
	InspectorControls,
	mediaUpload,
} from '@wordpress/editor';

import {
	DropZone,
	FormFileUpload,
	IconButton,
	SelectControl,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import { filter, get, pick } from 'lodash';

/**
 * Internal dependencies
 */

import Slideshow from './component.js';
import { settings } from './settings';
import { icon } from '.';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

export const pickRelevantMediaFiles = image => {
	const simpleImage = pick( image, [ 'alt', 'id', 'link', 'url', 'caption' ] );
	simpleImage.width = get( image, 'sizes.full.width' );
	simpleImage.height = get( image, 'sizes.full.height' );
	return simpleImage;
};

class SlideshowEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			selectedImage: null,
		};
	}
	onSelectImages = images => {
		const { setAttributes } = this.props;
		const mapped = images.map( image => pickRelevantMediaFiles( image ) );
		setAttributes( {
			images: mapped,
		} );
	};
	onSelectImage = index => {
		return () => {
			if ( this.state.selectedImage !== index ) {
				this.setState( {
					selectedImage: index,
				} );
			}
		};
	};
	onRemoveImage = index => {
		return () => {
			const images = filter( this.props.attributes.images, ( img, i ) => index !== i );
			const { columns } = this.props.attributes;
			this.setState( { selectedImage: null } );
			this.props.setAttributes( {
				images,
				columns: columns ? Math.min( images.length, columns ) : columns,
			} );
		};
	};
	updateAlignment = value => {
		this.props.setAttributes( { align: value } );
	};
	addFiles( files ) {
		const currentImages = this.props.attributes.images || [];
		const { noticeOperations, setAttributes } = this.props;
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList: files,
			onFileChange: images => {
				const imagesNormalized = images.map( image => pickRelevantMediaFiles( image ) );
				setAttributes( {
					images: currentImages.concat( imagesNormalized ),
				} );
			},
			onError: noticeOperations.createErrorNotice,
		} );
	}
	uploadFromFiles = event => this.addFiles( event.target.files );
	render() {
		const {
			attributes,
			className,
			isSelected,
			noticeOperations,
			noticeUI,
			setAttributes,
		} = this.props;
		const { align, effect, images } = attributes;

		const dropZone = <DropZone onFilesDrop={ this.addFiles } />;

		const controls = (
			<Fragment>
				<InspectorControls>
					<SelectControl
						label={ __( 'Transition effect' ) }
						value={ effect }
						onChange={ value => {
							setAttributes( { effect: value } );
						} }
						options={ settings.effectOptions }
					/>
				</InspectorControls>
				<BlockControls>
					<BlockAlignmentToolbar
						value={ align }
						onChange={ this.updateAlignment }
						controls={ [ 'center', 'wide', 'full' ] }
					/>
					{ !! images.length && (
						<Toolbar>
							<MediaUpload
								onSelect={ this.onSelectImages }
								allowedTypes={ ALLOWED_MEDIA_TYPES }
								multiple
								gallery
								value={ images.map( img => img.id ) }
								render={ ( { open } ) => (
									<IconButton
										className="components-toolbar__control"
										label={ __( 'Edit Slideshow' ) }
										icon="edit"
										onClick={ open }
									/>
								) }
							/>
						</Toolbar>
					) }
				</BlockControls>
			</Fragment>
		);

		if ( images.length === 0 ) {
			return (
				<Fragment>
					{ controls }
					<MediaPlaceholder
						icon={ <div className="slideshow__media-placeholder-icon">{ icon }</div> }
						className={ className }
						labels={ {
							title: __( 'Slideshow' ),
							instructions: __( 'Drag images, upload new ones or select files from your library.' ),
						} }
						onSelect={ this.onSelectImages }
						accept="image/*"
						allowedTypes={ ALLOWED_MEDIA_TYPES }
						multiple
						notices={ noticeUI }
						onError={ noticeOperations.createErrorNotice }
					/>
				</Fragment>
			);
		}
		return (
			<Fragment>
				{ controls }
				{ noticeUI }
				<div className={ className }>
					<Slideshow effect={ effect } align={ align }>
						{ images.map( ( image, index ) => {
							const { alt, caption, height, id, url, width } = image;
							return (
								<div className="wp-block-slideshow_image_container" key={ index }>
									<img
										src={ url }
										alt={ alt }
										data-is-image={ true }
										data-id={ id }
										data-height={ height }
										data-width={ width }
									/>
									<figcaption data-is-caption={ true }>{ caption }</figcaption>
								</div>
							);
						} ) }
					</Slideshow>
					{ dropZone }
					{ isSelected && (
						<div className="tiled-gallery__add-item">
							<FormFileUpload
								multiple
								isLarge
								className="slideshow__add-item-button"
								onChange={ this.uploadFromFiles }
								accept="image/*"
								icon="insert"
							>
								{ __( 'Upload an image' ) }
							</FormFileUpload>
						</div>
					) }
				</div>
			</Fragment>
		);
	}
}

export default withNotices( SlideshowEdit );